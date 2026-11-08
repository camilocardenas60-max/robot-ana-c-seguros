// Modo reunión: Claude resume la transcripción y la envía por correo con Resend.
// Variables: ANTHROPIC_API_KEY, RESEND_API_KEY, RESUMEN_EMAIL, ROBOT_PIN (obligatorias);
//            RESEND_FROM y CLAUDE_MODEL_RESUMEN (opcionales).

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function armarCorreo(r, meta) {
  const lista = (items, fmt) => items && items.length
    ? `<ul style="padding-left:20px;margin:6px 0 18px">${items.map((i) => `<li style="margin:4px 0">${fmt(i)}</li>`).join("")}</ul>`
    : `<p style="color:#5b6b85;margin:6px 0 18px">Ninguno.</p>`;
  const h = (t) => `<h2 style="font-size:17px;color:#123E86;margin:18px 0 4px">${t}</h2>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1d2a44;max-width:640px">
    <h1 style="font-size:21px;color:#123E86;margin:0 0 4px">${esc(r.titulo || "Resumen de reunión")}</h1>
    <p style="color:#5b6b85;margin:0 0 14px">${esc(meta.fecha)} · Duración: ${esc(meta.duracion)}</p>
    ${h("Resumen")}<p style="margin:6px 0 18px">${esc(r.resumen)}</p>
    ${h("Decisiones")}${lista(r.decisiones, esc)}
    ${h("Tareas")}${lista(r.tareas, (t) => `<b>${esc(t.responsable || "Sin asignar")}:</b> ${esc(t.tarea)}${t.fecha ? ` <span style="color:#5b6b85">(${esc(t.fecha)})</span>` : ""}`)}
    ${h("Pendientes")}${lista(r.pendientes, esc)}
    <p style="color:#5b6b85;font-size:13px;margin-top:24px">La transcripción completa va adjunta. Resumen generado por Valery, la asistente de Ana C de Seguros; revisa los datos importantes antes de actuar.</p>
  </div>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Usa POST." }); }
  const { ROBOT_PIN, ANTHROPIC_API_KEY, RESEND_API_KEY, RESUMEN_EMAIL } = process.env;
  if (!ANTHROPIC_API_KEY || !RESEND_API_KEY || !RESUMEN_EMAIL) {
    return res.status(500).json({ error: "Faltan variables en Vercel: RESEND_API_KEY y/o RESUMEN_EMAIL.", codigo: "config" });
  }
  if (!ROBOT_PIN || req.headers["x-robot-pin"] !== ROBOT_PIN) return res.status(401).json({ error: "PIN incorrecto.", codigo: "pin" });

  let cuerpo = req.body;
  if (typeof cuerpo === "string") { try { cuerpo = JSON.parse(cuerpo || "{}"); } catch { cuerpo = {}; } }
  const transcripcion = String(cuerpo?.transcripcion || "").trim();
  const meta = { fecha: String(cuerpo?.fecha || ""), duracion: String(cuerpo?.duracion || "") };
  if (transcripcion.length < 20) return res.status(400).json({ error: "La transcripción está vacía." });

  // 1. Resumen con Claude
  let r;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL_RESUMEN || "claude-sonnet-5-5",
        max_tokens: 2000,
        system: `Resumes reuniones de Ana C de Seguros, una agencia de seguros en Colombia cuya dueña es Ana Carolina (Caro), corredora de seguros. La transcripción es automática: puede tener errores y las personas aparecen como "Persona 0", "Persona 1"; si el contexto revela el nombre de alguien, úsalo. No inventes nada que no se haya dicho. Responde SOLO con JSON válido, sin texto adicional ni bloques de código, con esta forma:
{"titulo": "tema principal en pocas palabras", "resumen": "3 a 5 frases", "decisiones": ["..."], "tareas": [{"responsable": "...", "tarea": "...", "fecha": "fecha o plazo si se mencionó, si no vacío"}], "pendientes": ["temas sin cerrar o dudas"]}`,
        messages: [{ role: "user", content: `Fecha: ${meta.fecha}\nDuración: ${meta.duracion}\n\nTranscripción:\n${transcripcion.slice(0, 400000)}` }],
      }),
    });
    const datos = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(datos?.error?.message || `Claude ${resp.status}`);
    const textoClaude = (datos.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const limpio = textoClaude.replace(/```json|```/g, "").trim();
    try { r = JSON.parse(limpio.slice(limpio.indexOf("{"), limpio.lastIndexOf("}") + 1)); }
    catch { r = { titulo: "Resumen de reunión", resumen: limpio, decisiones: [], tareas: [], pendientes: [] }; }
  } catch (e) {
    console.error("Error resumiendo", e);
    return res.status(502).json({ error: "No se pudo generar el resumen." });
  }

  // 2. Correo con Resend
  try {
    const envio = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Valery · Ana C <onboarding@resend.dev>",
        to: RESUMEN_EMAIL.split(",").map((s) => s.trim()).filter(Boolean),
        subject: `Resumen: ${r.titulo || "reunión"} (${meta.fecha})`,
        html: armarCorreo(r, meta),
        attachments: [{ filename: "transcripcion.txt", content: Buffer.from(transcripcion, "utf-8").toString("base64") }],
      }),
    });
    if (!envio.ok) {
      const d = await envio.text().catch(() => "");
      console.error("Error Resend", envio.status, d.slice(0, 500));
      return res.status(502).json({ error: "El resumen se generó, pero no se pudo enviar el correo.", resumen: r });
    }
  } catch (e) {
    console.error("Fallo de red Resend", e);
    return res.status(502).json({ error: "No pude conectar con el servicio de correo.", resumen: r });
  }

  return res.status(200).json({ ok: true, titulo: r.titulo, tareas: (r.tareas || []).length });
}
