import datetime
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(150), nullable=False)
    correo = Column(String(255), unique=True, index=True, nullable=False)
    azure_oid = Column(String(64), unique=True, index=True, nullable=True)  # Microsoft Object ID
    rol = Column(String(20), nullable=False, default="colaborador")
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)

    legalizaciones = relationship("Legalizacion", back_populates="usuario")

class Legalizacion(Base):
    __tablename__ = "legalizaciones"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    destino_motivo = Column(String(255), nullable=False)
    anticipo = Column(Numeric(12, 2), nullable=False, default=0.00)
    total_gastado = Column(Numeric(12, 2), nullable=False, default=0.00)
    saldo = Column(Numeric(12, 2), nullable=False, default=0.00)
    estado = Column(String(20), nullable=False, default="Borrador")  # Borrador, Enviado, Finalizado
    fecha_inicio = Column(Date, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    
    usuario = relationship("User", back_populates="legalizaciones")
    gastos = relationship("Gasto", back_populates="legalizacion", cascade="all, delete-orphan")

class Gasto(Base):
    __tablename__ = "gastos"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    legalizacion_id = Column(Integer, ForeignKey("legalizaciones.id", ondelete="CASCADE"), nullable=False)
    descripcion = Column(String(255), nullable=False)
    categoria = Column(String(50), nullable=False)  # Transporte, Alimentacion, Hospedaje, Otros
    monto = Column(Numeric(12, 2), nullable=False)
    comprobante_url = Column(String(1000), nullable=True)  # URL de SharePoint
    sharepoint_item_id = Column(String(100), nullable=True)
    fecha_gasto = Column(Date, nullable=False)
    
    # Nuevos campos para reporte formal (PCM Engineering format)
    no_comprobante = Column(String(50), nullable=True)
    proveedor = Column(String(150), nullable=True)
    tin = Column(String(50), nullable=True)
    direccion = Column(String(255), nullable=True)
    telefono = Column(String(50), nullable=True)
    ciudad = Column(String(50), nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=True)
    iva = Column(Numeric(12, 2), nullable=True)
    
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)
    
    legalizacion = relationship("Legalizacion", back_populates="gastos")
