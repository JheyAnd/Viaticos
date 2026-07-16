from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth_utils import verify_pandora_token, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autenticacion SSO"])

class PandoraTokenPayload(BaseModel):
    pandora_token: str

@router.post("/pandora", response_model=schemas.TokenResponse)
async def pandora_sso(payload: PandoraTokenPayload, db: Session = Depends(get_db)):
    """
    Recibe el JWT de Pandora SSO (ya verificado por Microsoft AD),
    lo valida contra Pandora, y emite un JWT interno de Biaticos.
    Crea o sincroniza el usuario local con rol colaborador si es nuevo.
    """
    pandora_user = await verify_pandora_token(payload.pandora_token)

    correo = pandora_user.get("email", "").strip().lower()
    nombre = pandora_user.get("name") or pandora_user.get("email", "Usuario")
    oid    = pandora_user.get("oid") or pandora_user.get("id") or pandora_user.get("user_id") or ""

    if not correo:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pandora no retorno el correo del usuario.")

    # Determinar rol según config.py / .env
    from config import settings
    superadmin_emails = [e.strip().lower() for e in settings.SUPERADMIN_EMAILS.split(",") if e.strip()]
    admin_emails = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()]

    target_role = "colaborador"
    if correo in superadmin_emails:
        target_role = "superadmin"
    elif correo in admin_emails:
        target_role = "admin"

    # Buscar por OID primero, luego por correo
    user = None
    if oid:
        user = db.query(models.User).filter(models.User.azure_oid == str(oid)).first()
    if not user:
        user = db.query(models.User).filter(models.User.correo == correo).first()

    if user:
        # Sincronizar nombre, OID y rol
        user.nombre = nombre
        if oid and not user.azure_oid:
            user.azure_oid = str(oid)
        # Sincronizar/actualizar rol si el rol destino es admin/superadmin o si el usuario es colaborador y tiene otro rol asignado
        if target_role != "colaborador" or user.rol == "colaborador":
            user.rol = target_role
        db.commit()
        db.refresh(user)
    else:
        user = models.User(nombre=nombre, correo=correo, azure_oid=str(oid) if oid else None, rol=target_role)
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token(data={"sub": user.correo})
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/users", response_model=List[schemas.UserResponse])
def get_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.rol != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos.")
    return db.query(models.User).order_by(models.User.fecha_creacion.desc()).all()


@router.put("/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    payload: schemas.UserRoleUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.rol != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tiene permisos.")
    if payload.rol not in ["colaborador", "admin", "superadmin"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rol invalido.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="El usuario no existe.")
    if user.id == current_user.id and payload.rol != "superadmin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puede cambiarse su propio rol de superadmin.")
    user.rol = payload.rol
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un usuario.
    Permitido para roles superadmin y admin.
    """
    if current_user.rol not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para realizar esta acción."
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El usuario no existe."
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede eliminarse a sí mismo."
        )
    db.delete(user)
    db.commit()
    return

