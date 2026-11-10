// Reporte semanal: Claude resume los recados de la semana y lo envía por correo con Resend.
// Variables: ANTHROPIC_API_KEY, RESEND_API_KEY, RESUMEN_EMAIL, ROBOT_PIN; opcionales RESEND_FROM y CLAUDE_MODEL_RESUMEN.

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Usa POST." }); }
  const { ROBOT_PIN, ANTHROPIC_API_KEY, RESEND_API_KEY, RESUMEN_EMAIL } = process.env;
  if (!ANTHROPIC_API_KEY || !RESEND_API_KEY || !RESUMEN_EMAIL) return res.status(500).json({ error: "Faltan RESEND_API_KEY y/o RESUMEN_EMAIL en Vercel.", codigo: "config" });
  if (!ROBOT_PIN || req.headers["x-robot-pin"] !== ROBOT_PIN) return res.status(401).json({ error: "PIN incorrecto.", codigo: "pin" });

  let cuerpo = req.body;
  if (typeof cuerpo === "string") { try { cuerpo = JSON.parse(cuerpo || "{}"); } catch { cuerpo = {}; } }
  const recados = (Array.isArray(cuerpo?.recados) ? cuerpo.recados : []).slice(-100).map((r) => ({
    texto: String(r?.texto || "").slice(0, 200), creado: String(r?.creado || "").slice(0, 30), hecho: !!r?.hecho,
  })).filter((r) => r.texto);
  const memoria = (Array.isArray(cuerpo?.memoria) ? cuerpo.memoria : []).slice(-50).map((m) => String(m).slice(0, 200));
  const semana = String(cuerpo?.semana || "");

  let r;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL_RESUMEN || "claude-sonnet-5-5",
        max_tokens: 1500,
        system: `Eres Valery, la asistente de Ana Carolina (Caro), corredora de seguros. Escribe su reporte semanal a partir de los recados y pendientes que se registraron. Tono cálido, claro y breve. No inventes nada que no esté en los datos. Responde SOLO con JSON válido, sin bloques de código: {"resumen":"2 a 4 frases","atendidos":["..."],"pendientes":["..."],"sugerencias":["1 a 3 ideas prácticas para la próxima semana"]}`,
        messages: [{ role: "user", content: `Semana: ${semana}\nRecados:\n${recados.map((x) => `- [${x.hecho ? "atendido" : "pendiente"}] ${x.texto} (${x.creado})`).join("\n") || "(ninguno)"}\nCosas que Valery recuerda:\n${memoria.map((m) => "- " + m).join("\n") || "(nada)"}` }],
      }),
    });
    const d = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(d?.error?.message || resp.status);
    const t = (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").replace(/```json|```/g, "").trim();
    try { r = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); } catch { r = { resumen: t, atendidos: [], pendientes: [], sugerencias: [] }; }
  } catch (e) {
    console.error("Error generando reporte", e);
    return res.status(502).json({ error: "No se pudo generar el reporte." });
  }

  const lista = (xs) => xs && xs.length ? `<ul style="padding-left:20px;margin:6px 0 18px">${xs.map((i) => `<li style="margin:4px 0">${esc(i)}</li>`).join("")}</ul>` : `<p style="color:#5b6b85;margin:6px 0 18px">Ninguno.</p>`;
  const h = (t) => `<h2 style="font-size:17px;color:#123E86;margin:18px 0 4px">${t}</h2>`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1d2a44;max-width:640px">
    <h1 style="font-size:21px;color:#123E86;margin:0 0 4px">Reporte semanal de Valery</h1>
    <p style="color:#5b6b85;margin:0 0 14px">${esc(semana)}</p>
    ${h("Resumen")}<p style="margin:6px 0 18px">${esc(r.resumen)}</p>
    ${h("Atendidos")}${lista(r.atendidos)}${h("Pendientes")}${lista(r.pendientes)}${h("Ideas para la próxima semana")}${lista(r.sugerencias)}
  </div>`;

  try {
    const envio = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || "Valery · Ana C <onboarding@resend.dev>",
        to: RESUMEN_EMAIL.split(",").map((s) => s.trim()).filter(Boolean),
        subject: `Reporte semanal de Valery (${semana})`,
        html,
      }),
    });
    if (!envio.ok) { console.error("Error Resend", envio.status, (await envio.text()).slice(0, 300)); return res.status(502).json({ error: "No se pudo enviar el correo." }); }
  } catch (e) {
    console.error("Fallo de red Resend", e);
    return res.status(502).json({ error: "No pude conectar con el servicio de correo." });
  }
  return res.status(200).json({ ok: true });
}
