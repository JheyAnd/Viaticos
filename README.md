# ✈️ Sistema de Legalización de Viáticos y Gastos

Este es un sistema web corporativo diseñado para la gestión, aprobación y legalización de viáticos y gastos de viaje, integrado con autenticación empresarial de Microsoft Azure AD y procesamiento inteligente de comprobantes mediante Inteligencia Artificial (Google Gemini).

---

## 🏗️ Arquitectura del Proyecto

El proyecto está dividido en dos partes principales:

1. **Backend (`/backend`)**:
   - Desarrollado en **Python** con **FastAPI**.
   - Base de datos relacional orientada a **MySQL** (producción) con fallback automático a **SQLite** local (`biaticos.db`) para desarrollo.
   - Gestión de migraciones con **Alembic**.
   - Integración con **Google GenAI** (Gemini 3.1) para extracción automatizada de datos de facturas y recibos (OCR).
   - Integración con **SharePoint/Azure Graph API** para el almacenamiento de comprobantes físicos.

2. **Frontend (`/frontend`)**:
   - Desarrollado en **React** con **Vite**.
   - Estilizado utilizando **TailwindCSS** para una experiencia de usuario moderna y responsiva.
   - Conexión e inicio de sesión integrados con el flujo corporativo de **Pandora SSO (Azure AD / Microsoft Login)**.

---

## 🛠️ Tecnologías Clave

* **Framework Backend**: FastAPI (Python >= 3.10)
* **Motor de Base de Datos**: SQLAlchemy ORM (MySQL / SQLite)
* **Digitalización con IA**: SDK `google-genai` (Modelo: `gemini-3.1-flash-lite`)
* **Almacenamiento en la Nube**: Microsoft SharePoint API
* **Autenticación**: JWT Tokens + Azure AD SSO
* **Interfaz de Usuario**: React.js, Tailwind CSS, Lucide Icons

---

## ⚙️ Configuración del Entorno

En el directorio `/backend`, crea o edita el archivo `.env` con las siguientes variables básicas:

```env
# Servidor
PORT=8016
HOST=0.0.0.0

# Base de datos (MySQL o cambiar a SQLite sqlite:///./biaticos.db)
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:<port>/biaticos_db

# Seguridad
JWT_SECRET=tu_secreto_super_seguro_jwt

# Integración Azure AD / SharePoint
AZURE_CLIENT_ID=tu_client_id_de_azure
AZURE_TENANT_ID=tu_tenant_id_de_azure
AZURE_CLIENT_SECRET=tu_client_secret_de_azure
SHAREPOINT_SITE_ID=dominio.sharepoint.com:/sites/NombreSitio
SHAREPOINT_FOLDER_PATH=Documentos_Compartidos/RutaCarpeta

# Google AI Studio API Key (para OCR de facturas y cheques)
GEMINI_API_KEY=tu_api_key_de_google_ai_studio
```

---

## 🚀 Cómo Iniciar el Proyecto

Para facilitar el desarrollo, el proyecto incluye scripts automatizados de encendido y apagado en la raíz:

### Iniciar el Sistema:
* **Windows (PowerShell)**: Ejecuta `./iniciar.ps1`
* **Windows (Command Prompt)**: Ejecuta `iniciar.bat`

*Estos scripts realizarán las siguientes acciones de forma automática:*
1. Levantarán el **Backend** en `http://localhost:8016` (con recarga en vivo).
2. Levantarán el **Frontend** en `http://localhost:5173`.
3. Abrirán automáticamente el navegador en la pestaña de la aplicación.

### Detener el Sistema:
* **Windows (PowerShell)**: Ejecuta `./cerrar.ps1`
* **Windows (Command Prompt)**: Ejecuta `cerrar.bat`

*Estos scripts finalizarán todos los procesos de node y python en ejecución asociados a la aplicación.*

---

## 👥 Roles de Usuario y Permisos

El sistema implementa tres niveles de acceso basados en roles corporativos:

* **Super Administrador (`superadmin`)**:
  - Control total del sistema.
  - Gestión de usuarios y asignación de roles.
  - Eliminación permanente de cualquier legalización.
  - Aprobación y finalización de viáticos.
* **Administrador (`admin`)**:
  - Vista global ("Control y Aprobación de Viáticos") para supervisar los gastos de todos los colaboradores.
  - Aprobación, devolución (a Borrador) y rechazo de legalizaciones.
  - Eliminación de legalizaciones registradas.
* **Colaborador (`colaborador` / por defecto)**:
  - Registro de sus propias solicitudes de viáticos.
  - Carga y digitalización asistida por IA de sus facturas, recibos de caja y cheques.
  - Envío a revisión de sus solicitudes.

---

## 🧠 Extracción Inteligente OCR con Gemini

La aplicación permite subir fotos de recibos, facturas, comprobantes de pago e incluso cheques. La IA analiza el archivo y extrae automáticamente en segundos:
* Proveedor/Establecimiento o Banco emisor.
* Monto total del gasto.
* Fecha de la transacción (normalizada a formato estándar `AAAA-MM-DD`).
* IVA desglosado.
* Clasificación automática por categorías (Transporte, Alimentación, Hospedaje, Otros).
