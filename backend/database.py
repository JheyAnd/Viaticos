import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

logger = logging.getLogger("BiaticosApp.Database")

# Intentar conectar a MySQL, si falla, hacer fallback a SQLite local para que el desarrollo no se detenga
db_url = settings.DATABASE_URL
engine = None
SessionLocal = None

try:
    if db_url.startswith("sqlite"):
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
    else:
        # Intentar conectar a MySQL con un timeout corto para no colgar el arranque
        engine = create_engine(
            db_url, 
            pool_pre_ping=True, 
            connect_args={"connect_timeout": 5}
        )
        # Probar conexión básica
        with engine.connect() as conn:
            pass
        logger.info("Conexión exitosa a MySQL establecida.")
except Exception as e:
    logger.warning(
        f"No se pudo conectar a MySQL ({e}). Haciendo fallback a SQLite local (biaticos.db)."
    )
    fallback_url = "sqlite:///./biaticos.db"
    engine = create_engine(fallback_url, connect_args={"check_same_thread": False})
from sqlalchemy import event

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in str(engine.url):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
