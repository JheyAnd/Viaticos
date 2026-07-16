import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    APP_NAME: str = "Sistema de Legalizacion de Viaticos"
    APP_VERSION: str = "2.0.0"

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./biaticos.db")

    JWT_SECRET: str = os.getenv("JWT_SECRET", "safe_development_default_jwt_secret_key_12345678")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas

    # Mapeo de Roles
    SUPERADMIN_EMAILS: str = os.getenv("SUPERADMIN_EMAILS", "")
    ADMIN_EMAILS: str = os.getenv("ADMIN_EMAILS", "")

    # URL del microservicio Pandora SSO para verificar tokens
    PANDORA_VERIFY_URL: str = os.getenv("PANDORA_VERIFY_URL", "https://pandora.pcmejia.com/api/v1/auth/verify")

    # Credenciales de Azure AD / SharePoint
    AZURE_CLIENT_ID: str = os.getenv("AZURE_CLIENT_ID", "")
    AZURE_TENANT_ID: str = os.getenv("AZURE_TENANT_ID", "")
    AZURE_CLIENT_SECRET: str = os.getenv("AZURE_CLIENT_SECRET", "")

    SHAREPOINT_SITE_ID: str = os.getenv("SHAREPOINT_SITE_ID", "")
    SHAREPOINT_FOLDER_PATH: str = os.getenv("SHAREPOINT_FOLDER_PATH", "")

    # Google Gemini Vision (OCR de recibos con IA)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()