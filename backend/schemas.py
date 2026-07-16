from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

# --- SCHEMAS DE USUARIOS ---
class UserMinResponse(BaseModel):
    id: int
    nombre: str
    correo: EmailStr

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    nombre: str
    correo: EmailStr
    rol: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserRoleUpdate(BaseModel):
    rol: str

# --- SCHEMAS DE GASTOS ---
class GastoCreate(BaseModel):
    descripcion: str = Field(..., max_length=255)
    categoria: str = Field(..., description="Transporte, Alimentacion, Hospedaje, Otros")
    monto: Decimal = Field(..., gt=0)
    fecha_gasto: date
    no_comprobante: Optional[str] = Field(None, max_length=50)
    proveedor: Optional[str] = Field(None, max_length=150)
    tin: Optional[str] = Field(None, max_length=50)
    direccion: Optional[str] = Field(None, max_length=255)
    telefono: Optional[str] = Field(None, max_length=50)
    ciudad: Optional[str] = Field(None, max_length=50)
    subtotal: Optional[Decimal] = Field(None, ge=0)
    iva: Optional[Decimal] = Field(None, ge=0)

class GastoResponse(BaseModel):
    id: int
    legalizacion_id: int
    descripcion: str
    categoria: str
    monto: Decimal
    comprobante_url: Optional[str] = None
    fecha_gasto: date
    no_comprobante: Optional[str] = None
    proveedor: Optional[str] = None
    tin: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    ciudad: Optional[str] = None
    subtotal: Optional[Decimal] = None
    iva: Optional[Decimal] = None
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# --- SCHEMAS DE LEGALIZACIONES ---
class LegalizacionCreate(BaseModel):
    destino_motivo: str = Field(..., max_length=255)
    anticipo: Decimal = Field(default=0.00, ge=0)
    fecha_inicio: date

class LegalizacionUpdate(BaseModel):
    destino_motivo: Optional[str] = Field(None, max_length=255)
    estado: Optional[str] = Field(None, description="Borrador, Enviado, Finalizado")

class LegalizacionResponse(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    destino_motivo: str
    anticipo: Decimal
    total_gastado: Decimal
    saldo: Decimal
    estado: str
    fecha_inicio: date
    fecha_creacion: datetime
    usuario: Optional[UserMinResponse] = None

    class Config:
        from_attributes = True

class LegalizacionDetailResponse(LegalizacionResponse):
    gastos: List[GastoResponse] = []
