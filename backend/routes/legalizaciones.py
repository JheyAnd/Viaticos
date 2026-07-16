from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from decimal import Decimal
from typing import List, Optional
from datetime import date
from database import get_db
import models
import schemas
from auth_utils import get_current_user
from sharepoint import upload_file_to_sharepoint

router = APIRouter(prefix="/api/legalizaciones", tags=["Legalizaciones y Gastos"])

# ──────────────────────────────────────────────────────────────
# UTILERÍA: Recalcular saldos de una legalización
# ──────────────────────────────────────────────────────────────
def recalculate_legalizacion(legalizacion: models.Legalizacion, db: Session):
    total = sum(g.monto for g in legalizacion.gastos)
    legalizacion.total_gastado = Decimal(total)
    legalizacion.saldo = legalizacion.anticipo - legalizacion.total_gastado
    db.commit()
    db.refresh(legalizacion)

# ──────────────────────────────────────────────────────────────
# ENDPOINTS DE LEGALIZACIONES
# ──────────────────────────────────────────────────────────────

@router.get("", response_model=List[schemas.LegalizacionResponse])
def list_legalizaciones(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista el historial completo de legalizaciones (del usuario o todas si es admin/superadmin)."""
    if current_user.rol in ["superadmin", "admin"]:
        return db.query(models.Legalizacion).order_by(models.Legalizacion.fecha_creacion.desc()).all()
    return db.query(models.Legalizacion).filter(
        models.Legalizacion.usuario_id == current_user.id
    ).order_by(models.Legalizacion.fecha_creacion.desc()).all()



@router.post("", response_model=schemas.LegalizacionResponse, status_code=status.HTTP_201_CREATED)
def create_legalizacion(
    payload: schemas.LegalizacionCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crea una nueva legalización de viáticos.
    El 'Valor Inicial' (Anticipo) es obligatorio (se inicializa en 0 si no se ingresa).
    """
    new_leg = models.Legalizacion(
        usuario_id=current_user.id,
        destino_motivo=payload.destino_motivo,
        anticipo=payload.anticipo,
        total_gastado=Decimal(0.00),
        saldo=payload.anticipo,  # Saldo inicial es igual al anticipo
        estado="Borrador",
        fecha_inicio=payload.fecha_inicio
    )
    db.add(new_leg)
    db.commit()
    db.refresh(new_leg)
    return new_leg


@router.get("/{id}", response_model=schemas.LegalizacionDetailResponse)
def get_legalizacion(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene los detalles de una legalización y su lista de gastos, recalculando la liquidación."""
    query = db.query(models.Legalizacion).filter(models.Legalizacion.id == id)
    if current_user.rol not in ["superadmin", "admin"]:
        query = query.filter(models.Legalizacion.usuario_id == current_user.id)
    leg = query.first()
    
    if not leg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La legalización no existe o no tiene permisos para verla."
        )
        
    # Recalcular saldos antes de retornar por seguridad
    recalculate_legalizacion(leg, db)
    return leg



@router.put("/{id}", response_model=schemas.LegalizacionResponse)
def update_legalizacion(
    id: int,
    payload: schemas.LegalizacionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permite actualizar la legalización (ej: cambiar estado de 'Borrador' a 'Enviado' o 'Finalizado').
    """
    query = db.query(models.Legalizacion).filter(models.Legalizacion.id == id)
    if current_user.rol not in ["superadmin", "admin"]:
        query = query.filter(models.Legalizacion.usuario_id == current_user.id)
    leg = query.first()
    
    if not leg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La legalización no existe."
        )
        
    # Validar transiciones de estado
    if current_user.rol not in ["superadmin", "admin"]:
        if leg.estado in ["Enviado", "Finalizado"] and payload.estado != leg.estado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No se puede modificar una legalización en estado '{leg.estado}'."
            )
        
    if payload.destino_motivo is not None and current_user.rol not in ["superadmin", "admin"]:
        leg.destino_motivo = payload.destino_motivo
    if payload.estado is not None:
        if payload.estado not in ["Borrador", "Enviado", "Finalizado"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Estado inválido. Debe ser 'Borrador', 'Enviado' o 'Finalizado'."
            )
        leg.estado = payload.estado
        
    db.commit()
    db.refresh(leg)
    return leg



@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_legalizacion(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina una legalización.
    Solo el Superadmin y el Admin pueden eliminar cualquier legalización.
    """
    if current_user.rol not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo el Superadmin y el Admin están autorizados para eliminar legalizaciones."
        )
        
    leg = db.query(models.Legalizacion).filter(models.Legalizacion.id == id).first()
    
    if not leg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La legalización no existe."
        )
        
    db.delete(leg)
    db.commit()
    return


# ──────────────────────────────────────────────────────────────
# ENDPOINTS DE GASTOS
# ──────────────────────────────────────────────────────────────

@router.post("/{id}/gastos", response_model=schemas.GastoResponse, status_code=status.HTTP_201_CREATED)
async def add_gasto(
    id: int,
    descripcion: str = Form(...),
    categoria: str = Form(...),
    monto: float = Form(...),
    fecha_gasto: str = Form(...),
    comprobante: Optional[UploadFile] = File(None),
    subtotal: Optional[float] = Form(None),
    iva: Optional[float] = Form(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Agrega un gasto individual a una legalización en estado 'Borrador'.
    Sube el archivo comprobante a SharePoint (o local fallback) si es provisto.
    """
    leg = db.query(models.Legalizacion).filter(
        models.Legalizacion.id == id,
        models.Legalizacion.usuario_id == current_user.id
    ).first()
    
    if not leg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La legalización no existe."
        )
        
    if leg.estado != "Borrador":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden agregar gastos a una legalización finalizada o enviada."
        )
        
    if categoria not in ["Transporte", "Alimentacion", "Hospedaje", "Otros"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoría inválida. Debe ser Transporte, Alimentacion, Hospedaje u Otros."
        )
        
    # Manejo del archivo comprobante
    comprobante_url = None
    sharepoint_item_id = None
    
    if comprobante:
        # Leer contenido del archivo
        file_bytes = await comprobante.read()
        file_name = comprobante.filename
        
        # Subir a SharePoint
        try:
            sp_result = await upload_file_to_sharepoint(leg.id, file_name, file_content=file_bytes)
            comprobante_url = sp_result.get("webUrl")
            sharepoint_item_id = sp_result.get("id")
        except Exception as e:
            # Si el fallback local también falla por alguna razón catastrófica
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al almacenar el comprobante: {str(e)}"
            )

    # Crear el registro del gasto
    new_gasto = models.Gasto(
        legalizacion_id=leg.id,
        descripcion=descripcion,
        categoria=categoria,
        monto=Decimal(monto),
        comprobante_url=comprobante_url,
        sharepoint_item_id=sharepoint_item_id,
        fecha_gasto=date.fromisoformat(fecha_gasto),
        subtotal=Decimal(subtotal) if subtotal is not None else None,
        iva=Decimal(iva) if iva is not None else None
    )
    
    db.add(new_gasto)
    db.commit()
    db.refresh(new_gasto)
    
    # Recalcular saldos de la legalización
    recalculate_legalizacion(leg, db)
    
    return new_gasto


@router.delete("/gastos/{gasto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gasto(
    gasto_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un gasto de una legalización. 
    Solo permitido si la legalización correspondiente está en estado 'Borrador'.
    """
    gasto = db.query(models.Gasto).filter(models.Gasto.id == gasto_id).first()
    if not gasto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El gasto no existe."
        )
        
    # Verificar propiedad y estado de la legalización
    leg = db.query(models.Legalizacion).filter(
        models.Legalizacion.id == gasto.legalizacion_id,
        models.Legalizacion.usuario_id == current_user.id
    ).first()
    
    if not leg:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para modificar este gasto."
        )
        
    if leg.estado != "Borrador":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden eliminar gastos de una legalización enviada o finalizada."
        )
        
    # Eliminar archivo local si existe en fallback
    # (El archivo de SharePoint se deja para histórico o control en Azure si se desea, o se borra)
    # Por simplicidad borramos el registro
    db.delete(gasto)
    db.commit()
    
    # Recalcular saldos
    recalculate_legalizacion(leg, db)
    return
