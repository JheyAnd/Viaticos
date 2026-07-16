import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from database import engine, Base
from routes.auth import router as auth_router
from routes.legalizaciones import router as leg_router
from routes.ocr import router as ocr_router
import models

STATIC_DIR = Path(__file__).resolve().parent / "static"
(STATIC_DIR / "uploads").mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Sistema de Legalizacion de Viaticos API",
    description="API REST integrada con Pandora SSO para autenticacion corporativa Microsoft.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.include_router(auth_router)
app.include_router(leg_router)
app.include_router(ocr_router)

@app.on_event("startup")
def migrate_schema():
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        # Agregar azure_oid si no existe
        try:
            conn.execute(text("SELECT azure_oid FROM users LIMIT 1"))
        except Exception:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN azure_oid VARCHAR(64)"))
                conn.commit()
                print("[Startup] Columna azure_oid agregada.")
            except Exception as e:
                print(f"[Startup] azure_oid: {e}")
        
        # Agregar columnas nuevas a la tabla 'gastos' si no existen
        columnas_gastos = [
            ("no_comprobante", "VARCHAR(50)"),
            ("proveedor", "VARCHAR(150)"),
            ("tin", "VARCHAR(50)"),
            ("direccion", "VARCHAR(255)"),
            ("telefono", "VARCHAR(50)"),
            ("ciudad", "VARCHAR(50)"),
            ("subtotal", "DECIMAL(12, 2)"),
            ("iva", "DECIMAL(12, 2)")
        ]
        for col_name, col_type in columnas_gastos:
            try:
                conn.execute(text(f"SELECT {col_name} FROM gastos LIMIT 1"))
            except Exception:
                try:
                    conn.execute(text(f"ALTER TABLE gastos ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"[Startup] Columna '{col_name}' agregada a tabla 'gastos'.")
                except Exception as e:
                    print(f"[Startup] Error al agregar '{col_name}' a 'gastos': {e}")
                    
    print("[Startup] Biaticos API lista. Autenticacion via Pandora SSO.")

@app.get("/health")
def health_check():
    return {"status": "ok", "app": "biaticos_api", "auth": "pandora_sso"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8016))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run("main:app", host=host, port=port, reload=True)