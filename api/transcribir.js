// Modo reunión: transcribe un tramo de audio con ElevenLabs Speech-to-Text.
// Variables: ELEVENLABS_API_KEY, ROBOT_PIN (obligatorias); ELEVENLABS_STT_MODEL (opcional).

function leerCuerpo(req) {
  return new Promise((resolver, rechazar) => {
    const partes = [];
    let total = 0;
    req.on("data", (c) => {
      total += c.length;
      if (total > 4_000_000) { rechazar(new Error("tramo muy grande")); req.destroy(); return; }
      partes.push(c);
    });
    req.on("end", () => resolver(Buffer.concat(partes)));
    req.on("error", rechazar);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Usa POST." }); }
  const pin = process.env.ROBOT_PIN;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(501).json({ error: "Falta ELEVENLABS_API_KEY en Vercel.", codigo: "config" });
  if (!pin || req.headers["x-robot-pin"] !== pin) return res.status(401).json({ error: "PIN incorrecto.", codigo: "pin" });

  let audio;
  try { audio = await leerCuerpo(req); } catch { return res.status(413).json({ error: "El tramo de audio es muy grande." }); }
  if (!audio.length) return res.status(400).json({ error: "No llegó audio." });

  const tipo = (req.headers["content-type"] || "audio/webm").split(";")[0];
  const form = new FormData();
  form.append("model_id", process.env.ELEVENLABS_STT_MODEL || "scribe_v1");
  form.append("language_code", "spa");
  form.append("diarize", "true");
  form.append("tag_audio_events", "false");
  form.append("file", new Blob([audio], { type: tipo }), tipo.includes("mp4") ? "tramo.m4a" : "tramo.webm");

  try {
    const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: form,
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("Error STT", r.status, JSON.stringify(datos).slice(0, 500));
      return res.status(502).json({ error: "No se pudo transcribir el tramo.", estado: r.status });
    }

    // Arma el texto por hablante si viene la separación de voces
    let texto = (datos.text || "").trim();
    if (Array.isArray(datos.words) && datos.words.some((w) => w.speaker_id)) {
      const bloques = [];
      for (const w of datos.words) {
        if (w.type === "audio_event") continue;
        const quien = w.speaker_id || "?";
        const ultimo = bloques[bloques.length - 1];
        if (ultimo && ultimo.quien === quien) ultimo.texto += w.text;
        else bloques.push({ quien, texto: w.text });
      }
      texto = bloques
        .map((b) => `[${b.quien.replace("speaker_", "Persona ")}] ${b.texto.trim()}`)
        .filter((l) => !/\]\s*$/.test(l))
        .join("\n");
    }
    return res.status(200).json({ texto });
  } catch (e) {
    console.error("Fallo de red STT", e);
    return res.status(502).json({ error: "No pude conectar con ElevenLabs." });
  }
}
