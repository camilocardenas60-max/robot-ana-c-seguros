# Robot Ana C de Seguros

Cara animada + voz (Fase 1) y agente Claude (Fase 2), para una tablet Lenovo Idea Tab en horizontal.

## Archivos
- `index.html`: cara, reconocimiento de voz, voz del robot, cámara (detecta movimiento y sigue con la mirada).
- `api/chat.js`: función de Vercel que habla con Claude. Protegida con PIN.
- `manifest.json` + `icon.svg`: permiten instalarlo como app a pantalla completa.

## Variables en Vercel (Settings → Environment Variables)
| Variable | Obligatoria | Qué es |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sí | Llave de la consola de Anthropic |
| `ROBOT_PIN` | Sí | PIN que se pide una vez en la tablet |
| `CLAUDE_MODEL` | No | Por defecto `claude-haiku-5-5` |

Después de crear o cambiar variables, haz **Redeploy**.

## En la tablet
1. Abre la URL en Chrome → escribe el PIN.
2. Permite micrófono y cámara.
3. Menú ⋮ → **Agregar a pantalla principal** → ábrelo desde el ícono.
