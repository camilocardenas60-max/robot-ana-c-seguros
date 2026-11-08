// Fase 2: agente Claude del robot de Ana C de Seguros.
// Variables en Vercel: ANTHROPIC_API_KEY, ROBOT_PIN (obligatorias); CLAUDE_MODEL (opcional).

const MODELO_POR_DEFECTO = "claude-haiku-5-5"; // rápido, ideal para voz

function promptSistema() {
  const ahora = new Date().toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "full",
    timeStyle: "short",
  });
  return `Eres el asistente físico de Ana C de Seguros, una agencia de seguros en Colombia dirigida por Ana. Eres un pequeño robot azul, sentado sobre el escritorio, con una cara animada en una tablet.

Con quién hablas: normalmente con Caro, que trabaja en la agencia, y a veces con clientes que llegan a la oficina.

Cómo hablas: todo lo que dices se lee en voz alta. Responde en una a tres frases cortas, en español de Colombia, cálido y profesional. Nada de listas, viñetas, emojis, markdown ni direcciones web. Los números dilos de forma natural. Hablas como una costeña de Valledupar: cálida y cercana, con expresiones naturales como "ajá", "ya mismo" o "tranquilo", sin exagerar y siempre respetuosa.

Aseguradoras aliadas: SURA, Allianz, Colmédica y CICA Life.

Citas: todavía no estás conectado a la agenda. Si te preguntan por citas, dilo con honestidad y ofrece repetir el recado en voz alta para que Caro lo anote.

Límites: no inventes precios, coberturas ni condiciones de pólizas. Para cotizaciones, sugiere hablar con Ana o escribir al WhatsApp de la agencia. No des asesoría legal ni médica.

Fecha y hora actual en Colombia: ${ahora}.`;
}

function limpiarMensajes(lista) {
  if (!Array.isArray(lista)) return [];
  const salida = [];
  for (const m of lista.slice(-12)) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    if (typeof m.content !== "string" || !m.content.trim()) continue;
    const texto = m.content.trim().slice(0, 2000);
    const ultimo = salida[salida.length - 1];
    if (ultimo && ultimo.role === m.role) ultimo.content += "\n" + texto; // une turnos seguidos del mismo rol
    else salida.push({ role: m.role, content: texto });
  }
  while (salida.length && salida[0].role !== "user") salida.shift();
  return salida;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Usa POST." });
  }

  const pin = process.env.ROBOT_PIN;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!pin || !apiKey) {
    return res.status(500).json({
      error: "Faltan variables en Vercel: ANTHROPIC_API_KEY y/o ROBOT_PIN.",
      codigo: "config",
    });
  }
  if (req.headers["x-robot-pin"] !== pin) {
    return res.status(401).json({ error: "PIN incorrecto.", codigo: "pin" });
  }

  let cuerpo = req.body;
  if (typeof cuerpo === "string") {
    try { cuerpo = JSON.parse(cuerpo || "{}"); } catch { cuerpo = {}; }
  }
  const mensajes = limpiarMensajes(cuerpo?.messages);
  if (!mensajes.length || mensajes[mensajes.length - 1].role !== "user") {
    return res.status(400).json({ error: "No llegó ninguna pregunta." });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || MODELO_POR_DEFECTO,
        max_tokens: 400,
        system: promptSistema(),
        messages: mensajes,
      }),
    });

    const datos = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("Error de Anthropic", r.status, JSON.stringify(datos).slice(0, 500));
      return res.status(502).json({ error: "El agente no respondió.", detalle: datos?.error?.message || r.status });
    }

    const respuesta = (datos.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .replace(/[*#_`>]/g, "")
      .trim();

    return res.status(200).json({ reply: respuesta || "Perdón, no te entendí. ¿Me lo repites?" });
  } catch (e) {
    console.error("Fallo de red", e);
    return res.status(502).json({ error: "No pude conectar con el agente." });
  }
}
