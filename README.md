# Robot Ana C de Seguros

Robot asistente para una tablet Lenovo Idea Tab en horizontal.

## Funciones
- **Cara y voz** (`index.html`): expresiones, parpadeo, cámara que sigue con la mirada, reconocimiento de voz.
- **Agente Claude** (`api/chat.js`): conversación general, clima (Open-Meteo, gratis), búsqueda web para noticias y datos actuales, historias y juegos. Protegido con PIN.
- **Voz costeña** (`api/voz.js`): ElevenLabs; si falla, usa la voz de la tablet.
- **Probador de voces** (`voces.html`): elige voz, tono y velocidad de la tablet.
- **Modo reunión** (`api/transcribir.js`, `api/resumen.js`): graba, transcribe y envía el resumen al correo.
- **Trabajo de Caro**: libreta de recados, calculadora (cuotas, porcentajes, días), lectura de documentos con la cámara, resumen del día y reporte semanal por correo (`api/reporte.js`).
- **Vida propia**: saludos por hora, fechas especiales, memoria de largo plazo, microgestos y comentarios espontáneos.

## Variables en Vercel (Settings → Environment Variables)
| Variable | Para qué | ¿Obligatoria? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Agente y resúmenes | Sí |
| `ROBOT_PIN` | PIN de la tablet | Sí |
| `ELEVENLABS_API_KEY` | Voz costeña y transcripción | Para voz y reuniones |
| `ELEVENLABS_VOICE_ID` | Voz elegida en ElevenLabs | Para la voz costeña |
| `RESEND_API_KEY` | Envío de correos | Para reuniones |
| `RESUMEN_EMAIL` | Correo que recibe los resúmenes | Para reuniones |
| `VALERY_FAMILIA` | Datos de la familia de Caro (privados, fuera del código) | No |
| `ROBOT_CIUDAD` | Ciudad por defecto para clima (por defecto Valledupar) | No |
| `WEB_SEARCH` | Pon `off` para desactivar la búsqueda web | No |
| `CLAUDE_MODEL`, `CLAUDE_MODEL_RESUMEN`, `ELEVENLABS_MODEL`, `ELEVENLABS_STT_MODEL`, `RESEND_FROM` | Ajustes avanzados | No |

Después de crear o cambiar variables, haz **Redeploy**.

## En la tablet
1. Abre la URL en Chrome → escribe el PIN → permite micrófono y cámara.
2. Menú ⋮ → **Agregar a pantalla principal**.
3. Para elegir voz local: abre `/voces.html`.
