import os
import httpx
import logging
from typing import Optional, Dict, Any
from pathlib import Path
from config import settings

logger = logging.getLogger("BiaticosApp.SharePoint")

# Carpeta local para fallback de subida de archivos (útil si falla SharePoint o no hay internet)
UPLOAD_DIR = Path(__file__).resolve().parent / "static" / "uploads"

async def get_access_token() -> Optional[str]:
    """Obtiene el token OAuth2 de Microsoft Entra usando Client Credentials flow."""
    tenant_id = settings.AZURE_TENANT_ID
    client_id = settings.AZURE_CLIENT_ID
    client_secret = settings.AZURE_CLIENT_SECRET

    if not tenant_id or not client_id or not client_secret:
        logger.warning("Credenciales de Azure AD no configuradas completamente.")
        return None

    url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    data = {
        "client_id": client_id,
        "scope": "https://graph.microsoft.com/.default",
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, data=data, timeout=10.0)
            resp.raise_for_status()
            return resp.json().get("access_token")
    except Exception as e:
        logger.error(f"Error obteniendo token de Azure AD: {e}")
        return None

async def upload_file_to_sharepoint(
    legalizacion_id: int, 
    file_name: str, 
    file_content: bytes
) -> Dict[str, Any]:
    """
    Sube un archivo directamente a SharePoint usando la Graph API de Microsoft.
    Si la subida a SharePoint falla (por credenciales o red), hace un fallback
    guardando el archivo de forma local en el servidor.
    """
    token = await get_access_token()
    
    if token:
        site_id = settings.SHAREPOINT_SITE_ID
        folder_path = settings.SHAREPOINT_FOLDER_PATH
        
        # URL de Microsoft Graph para carga de archivos
        # Ejemplo: https://graph.microsoft.com/v1.0/sites/pcmejiaing.sharepoint.com:/sites/InformacinProyectos/drive/root:/Documentos_Compartidos/Biaticos/1/gasto.jpg:/content
        graph_url = (
            f"https://graph.microsoft.com/v1.0/sites/{site_id}/drive/root:/"
            f"{folder_path}/{legalizacion_id}/{file_name}:/content"
        )
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/octet-stream"
        }
        
        try:
            logger.info(f"Intentando subir archivo '{file_name}' a SharePoint para Legalización #{legalizacion_id}...")
            async with httpx.AsyncClient() as client:
                resp = await client.put(graph_url, content=file_content, headers=headers, timeout=60.0)
                resp.raise_for_status()
                data = resp.json()
                
                logger.info(f"Archivo subido con éxito a SharePoint: {data.get('name')}")
                return {
                    "id": data.get("id"),
                    "webUrl": data.get("webUrl"),
                    "name": data.get("name"),
                    "storage_type": "sharepoint"
                }
        except Exception as e:
            logger.error(f"Fallo en la subida a SharePoint: {e}. Se procederá con fallback local.")
            if hasattr(e, 'response') and e.response:
                logger.error(f"Detalle de error de SharePoint: {e.response.text}")
    else:
        logger.warning("No se pudo obtener token de SharePoint. Se procederá con fallback local.")

    # FALLBACK LOCAL: Guardar el archivo en el servidor local
    try:
        logger.info(f"Guardando archivo '{file_name}' de forma local...")
        local_folder = UPLOAD_DIR / str(legalizacion_id)
        local_folder.mkdir(parents=True, exist_ok=True)
        
        local_file_path = local_folder / file_name
        with open(local_file_path, "wb") as f:
            f.write(file_content)
            
        logger.info(f"Archivo guardado localmente en: {local_file_path}")
        
        # Retorna una URL relativa accesible por el servidor web local
        local_url = f"/static/uploads/{legalizacion_id}/{file_name}"
        return {
            "id": f"local_{legalizacion_id}_{file_name}",
            "webUrl": local_url,
            "name": file_name,
            "storage_type": "local"
        }
    except Exception as local_err:
        logger.error(f"Error crítico en almacenamiento local fallback: {local_err}")
        raise RuntimeError(f"No se pudo guardar el archivo ni en SharePoint ni localmente: {local_err}")
