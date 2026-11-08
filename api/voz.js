// Voz costeña con ElevenLabs.
// Variables en Vercel: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, ROBOT_PIN (obligatorias); ELEVENLABS_MODEL (opcional).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Usa POST." });
  }

  const pin = process.env.ROBOT_PIN;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const vozId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !vozId) return res.status(501).json({ error: "Voz de ElevenLabs no configurada.", codigo: "sin-voz" });
  if (!pin || req.headers["x-robot-pin"] !== pin) return res.status(401).json({ error: "PIN incorrecto.", codigo: "pin" });

  let cuerpo = req.body;
  if (typeof cuerpo === "string") { try { cuerpo = JSON.parse(cuerpo || "{}"); } catch { cuerpo = {}; } }
  const texto = typeof cuerpo?.text === "string" ? cuerpo.text.trim().slice(0, 2500) : "";
  if (!texto) return res.status(400).json({ error: "No llegó texto." });

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vozId)}?output_format=mp3_44100_64`, {
      method: "POST",
      headers: { "content-type": "application/json", "xi-api-key": apiKey, accept: "audio/mpeg" },
      body: JSON.stringify({
        text: texto,
        model_id: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true },
      }),
    });
    if (!r.ok) {
      const detalle = await r.text().catch(() => "");
      console.error("Error de ElevenLabs", r.status, detalle.slice(0, 500));
      return res.status(502).json({ error: "ElevenLabs no respondió.", estado: r.status });
    }
    const audio = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(audio);
  } catch (e) {
    console.error("Fallo de red con ElevenLabs", e);
    return res.status(502).json({ error: "No pude conectar con ElevenLabs." });
  }
}
