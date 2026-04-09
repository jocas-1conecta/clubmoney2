# Arquitectura Técnica y Stack Tecnológico

Este documento define las tecnologías base y las integraciones externas (APIs) requeridas para construir el ecosistema de Club Money. Toda decisión de código debe respetar este stack.

## 1. Stack Tecnológico Principal
- **Base de Datos y Backend as a Service (BaaS):** Supabase (PostgreSQL). Se utilizará para la base de datos relacional, el sistema de autenticación de usuarios (Supabase Auth) y el almacenamiento de archivos (Supabase Storage para fotos, vouchers y contratos).
- **Frontend (Panel Web Administrativo):** React.js + Tailwind CSS. Uso exclusivo para Gerencia, Tesorería, Supervisores y Asesores Administrativos.
- **App Móvil (Operación de Campo):** PWA (Progressive Web App). Requerido para acceso nativo a GPS (geolocalización en segundo plano), Cámara (fotos in-app para billetes/fachadas) y almacenamiento local (Modo Offline).

## 2. Integraciones de APIs Externas
El sistema depende de los siguientes servicios de terceros:
- **Identidad y Antifraude:** API de consulta RENIEC (para extraer nombres validos mediante DNI) y proveedor de validación biométrica (ej. Metamap o Veriff) para la "prueba de vida".
- **Evaluación Crediticia:** Integración con API de central de riesgos (Seeker) para recibir respuesta en formato JSON y mapear el score en la base de datos.
- **Reconocimiento Óptico (OCR) e IA:** Integración con Google Cloud Vision API o AWS Textract para extraer texto automáticamente de:
  - Comprobantes de transferencia (Yape/Plin/Bancos) para capturar ID de operación, fecha y monto.
  - Reconocimiento de números de serie de billetes físicos capturados con la cámara.