import base64
import json
import re
import io
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse

from google import genai
from google.genai import types
from PIL import Image

from config import settings
from auth_utils import get_current_user

router = APIRouter(prefix="/api/ocr", tags=["OCR"])

CATEGORIAS_VALIDAS = ["Transporte", "Alimentacion", "Hospedaje", "Otros"]

PROMPT_ANALISIS = """
Eres un asistente experto en contabilidad que analiza fotos de facturas, recibos, cheques, transferencias bancarias y comprobantes de pago.

Analiza la imagen y extrae EXACTAMENTE los siguientes datos en formato JSON. Si no puedes encontrar un dato con certeza, usa null.

Responde UNICAMENTE con el JSON sin ningun texto adicional, sin markdown, sin explicaciones:

{
  "descripcion": "Descripcion breve del gasto, pago o transaccion (maximo 80 caracteres)",
  "monto": 0,
  "fecha": "YYYY-MM-DD",
  "categoria": "Transporte|Alimentacion|Hospedaje|Otros",
  "tiene_iva": false,
  "proveedor": "Nombre del establecimiento, emisor, banco o beneficiario",
  "confianza": "alta|media|baja"
}

Reglas:
- monto debe ser el TOTAL de la transaccion, pago o cobro (solo digitos y punto decimal, sin comas ni signos)
- fecha en formato YYYY-MM-DD. Si ves DD/MM/YYYY o YYYY/MM/DD, conviertela
- categoria: Transporte (taxis,buses,vuelos,peajes,gasolina,parqueadero), Alimentacion (restaurantes,cafeterias,comida), Hospedaje (hoteles,alojamiento), Otros
- tiene_iva: true solo si hay IVA desglosado en el comprobante
- confianza: alta (datos claros), media (algunos datos inciertos), baja (imagen poco legible)
- Si la imagen no es una factura, recibo, cheque, transferencia bancaria o comprobante de pago valido: {"error": "La imagen no parece ser un comprobante de pago"}
"""


@router.post("/analizar-recibo")
async def analizar_recibo(
    imagen: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    content_type = imagen.content_type or ""
    if not content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Solo se aceptan imagenes (JPG, PNG, WEBP). Los PDFs no pueden analizarse con IA."
        )

    if not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="El servicio de analisis con IA no esta configurado."
        )

    contenido = await imagen.read()
    if len(contenido) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen es demasiado grande (maximo 10MB).")

    try:
        img_pil = Image.open(io.BytesIO(contenido))
        if img_pil.mode not in ("RGB", "L"):
            img_pil = img_pil.convert("RGB")

        buffer = io.BytesIO()
        img_pil.save(buffer, format="JPEG", quality=90)
        buffer.seek(0)
        img_bytes = buffer.read()

        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=[
                types.Part.from_text(text=PROMPT_ANALISIS),
                types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
            ]
        )

        texto_respuesta = response.text.strip()
        texto_limpio = re.sub(r"```(?:json)?|```", "", texto_respuesta).strip()
        datos = json.loads(texto_limpio)

        if "error" in datos:
            raise HTTPException(status_code=422, detail=datos["error"])

        cat = datos.get("categoria", "Otros")
        if cat not in CATEGORIAS_VALIDAS:
            datos["categoria"] = "Otros"

        monto_raw = datos.get("monto")
        if monto_raw is not None:
            try:
                datos["monto"] = float(str(monto_raw).replace(",", ""))
            except (ValueError, TypeError):
                datos["monto"] = None

        return JSONResponse(content={
            "success": True,
            "datos": {
                "descripcion": datos.get("descripcion"),
                "monto": datos.get("monto"),
                "fecha": datos.get("fecha"),
                "categoria": datos.get("categoria", "Otros"),
                "tiene_iva": bool(datos.get("tiene_iva", False)),
                "proveedor": datos.get("proveedor"),
                "confianza": datos.get("confianza", "media")
            }
        })

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="No se pudo interpretar la respuesta de la IA. Intente con una imagen mas clara y bien iluminada."
        )
    except Exception as e:
        error_msg = str(e)
        if "API_KEY" in error_msg.upper() or "INVALID" in error_msg.upper() or "PERMISSION" in error_msg.upper():
            raise HTTPException(status_code=503, detail="Error de autenticacion con el servicio de IA. Verifique la API key.")
        raise HTTPException(status_code=500, detail=f"Error al analizar la imagen: {error_msg}")
