import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool, create_engine
from alembic import context

# ──────────────────────────────────────────────────────────────
# Asegurar que el módulo backend esté en el path de Python
# ──────────────────────────────────────────────────────────────
MODULE_DIR = Path(__file__).resolve().parent.parent  # → backend/
sys.path.insert(0, str(MODULE_DIR))

# Cargar configuración y modelos
from config import settings
from database import Base
import models  # Asegura que todos los modelos se registren en Base.metadata

# Configuración de Alembic
config = context.config

# Comprobar disponibilidad de MySQL. Si falla, usar SQLite local
db_url = settings.DATABASE_URL
if not db_url.startswith("sqlite"):
    try:
        # Intentar conectar con un timeout corto de 3 segundos
        test_engine = create_engine(db_url, connect_args={"connect_timeout": 3})
        with test_engine.connect() as conn:
            pass
    except Exception:
        print("[Alembic] ADVERTENCIA: No se pudo establecer conexión con MySQL.")
        print("[Alembic] Cambiando automáticamente a base de datos de desarrollo SQLite (biaticos.db).")
        db_url = "sqlite:///./biaticos.db"

# Sobreescribir la URL de base de datos en la configuración de Alembic
config.set_main_option("sqlalchemy.url", db_url)

# Configurar logging desde alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Ejecutar migraciones en modo offline."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Ejecutar migraciones en modo online."""
    db_url = config.get_main_option("sqlalchemy.url")
    
    # Parámetros especiales según dialecto
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        url=db_url,
        connect_args=connect_args
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
