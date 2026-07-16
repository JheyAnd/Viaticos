import datetime
import httpx
from typing import Optional
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from config import settings
from database import get_db
import models

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/pandora")

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def verify_pandora_token(pandora_token: str) -> dict:
    """Llama a Pandora SSO para verificar el JWT y obtener el perfil del usuario."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                settings.PANDORA_VERIFY_URL,
                json={"token": pandora_token},
                timeout=8.0
            )
        if resp.status_code != 200:
            detail = resp.json().get("detail", "desconocido") if resp.headers.get("content-type","").startswith("application/json") else resp.text
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Pandora rechazo el token: {detail}")
        data = resp.json()
        if not data.get("valid"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token de Pandora no valido.")
        return data.get("user", {})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"No se pudo contactar Pandora SSO ({settings.PANDORA_VERIFY_URL}): {e}")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesion invalida o expirada.", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        correo: str = payload.get("sub")
        if not correo:
            raise exc
    except JWTError:
        raise exc
    user = db.query(models.User).filter(models.User.correo == correo).first()
    if not user:
        raise exc
    return user