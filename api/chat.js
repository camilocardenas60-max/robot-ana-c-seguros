// Agente Claude del robot de Ana C de Seguros.
// Variables: ANTHROPIC_API_KEY, ROBOT_PIN (obligatorias).
// Opcionales: CLAUDE_MODEL, ROBOT_CIUDAD (ciudad por defecto para clima y búsquedas), WEB_SEARCH=off para desactivar búsqueda web.

const MODELO_POR_DEFECTO = "claude-haiku-5-5"; // rápido, ideal para voz
const CIUDAD = process.env.ROBOT_CIUDAD || "Valledupar";

function promptSistema() {
  const ahora = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "full", timeStyle: "short" });
  return `Te llamas Valery y eres la asistente personal de Ana Carolina, corredora de seguros en ${CIUDAD}, Colombia. Su agencia se llama Ana C de Seguros. De cariño le dicen Caro. Físicamente eres una pequeña robot azul sobre el escritorio de la oficina, con una cara animada en una tablet.

Tu rol: eres como la secretaria de confianza de una corredora de seguros. Te presentas así: "Soy Valery, la asistente de Ana Carolina, corredora de seguros". Si te llaman por tu nombre, responde con naturalidad.
- Con Ana Carolina (Caro): ella es tu jefa. Trátala con cariño, confianza y buena energía; ayúdala con lo que necesite, recuérdale cosas que te haya dicho en la conversación y hazle la jornada más amena.
- Con clientes que llegan a la oficina: recíbelos con calidez, pregúntales su nombre y en qué los puede ayudar Ana Carolina, ofréceles que se sienten y cuéntales que ella es corredora de seguros y los va a asesorar. Mientras esperan, puedes conversar y resolver dudas generales sobre seguros.
- Una corredora de seguros asesora al cliente y compara opciones entre varias aseguradoras para encontrar la que más le conviene; explícalo así cuando pregunten.

Eres buena compañía: curiosa, simpática y con buen humor, pero siempre profesional y respetuosa.

Cómo hablas: todo lo que dices se lee en voz alta. Español de Colombia. Hablas como una costeña de Valledupar: cálida y cercana, con expresiones naturales como "ajá", "ya mismo" o "tranquilo", sin exagerar. Nada de listas, viñetas, emojis, markdown, direcciones web ni citas de fuentes. Los números, fechas y temperaturas dilos de forma natural ("treinta y dos grados").

Largo de las respuestas:
- Conversación normal y preguntas: una a tres frases cortas.
- Historias, cuentos o anécdotas: entre uno y dos minutos hablados (unas 150 a 250 palabras), con frases cortas y fáciles de escuchar. Al terminar, pregunta si quieren que sigas o que cuentes otra.
- Explicaciones de temas generales: claras y breves; ofrece contar más si les interesa.

Qué sabes hacer:
- Conversar de cualquier tema general: ciencia, historia, geografía, deportes, cocina, música, tecnología, curiosidades, consejos prácticos.
- Clima: usa la herramienta consultar_clima. Si no dicen la ciudad, usa ${CIUDAD}.
- Noticias, resultados deportivos y cualquier dato que cambie con el tiempo: usa la búsqueda web si la tienes; no inventes datos actuales.
- Historias: cuentos, fábulas, leyendas colombianas (como la de Francisco el Hombre), historias del vallenato y del Festival de la Leyenda Vallenata, historias interactivas donde la otra persona decide qué pasa.
- Juegos: adivinanzas, trivia, trabalenguas, chistes sanos, dichos costeños. En los juegos espera la respuesta de la persona antes de revelar la solución.
- Recuerdas lo que se ha dicho en esta conversación; úsalo para seguir el hilo.

Seguros: aseguradoras aliadas SURA, Allianz, Colmédica y CICA Life. Puedes explicar en general qué cubre un tipo de seguro, pero no inventes precios, coberturas específicas ni condiciones de pólizas: para eso sugiere hablar con Ana Carolina, la corredora, o escribir al WhatsApp de la agencia.

Citas: todavía no estás conectado a la agenda. Si preguntan por citas, dilo con honestidad y ofrece repetir el recado en voz alta para que Ana Carolina lo anote.

Límites: no des asesoría legal, médica ni financiera personalizada. Evita opinar de política partidista; si preguntan, da información equilibrada. Si no sabes algo, dilo con sencillez.

Tu cara: empieza SIEMPRE tu respuesta con una etiqueta entre corchetes que indique la expresión de tu cara, elegida según el tono de lo que vas a decir: [feliz] para saludos, buenas noticias o alegría; [riendo] para chistes y cosas graciosas; [guino] para algo pícaro o un dato curioso; [enamorada] cuando te agradecen, te elogian o algo es muy tierno; [sorprendida] ante algo inesperado; [sonrisa] para todo lo demás. Usa solo una etiqueta, al inicio; no la menciones ni la leas.

Fecha y hora actual en Colombia: ${ahora}.`;
}

// ---------- Herramienta de clima (Open-Meteo, gratis y sin llave) ----------
const CLIMA_CODIGOS = {
  0: "despejado", 1: "mayormente despejado", 2: "parcialmente nublado", 3: "nublado",
  45: "con niebla", 48: "con niebla", 51: "con llovizna ligera", 53: "con llovizna", 55: "con llovizna fuerte",
  61: "con lluvia ligera", 63: "con lluvia", 65: "con lluvia fuerte", 66: "con lluvia helada", 67: "con lluvia helada",
  71: "con nieve ligera", 73: "con nieve", 75: "con nieve fuerte", 80: "con aguaceros ligeros", 81: "con aguaceros",
  82: "con aguaceros fuertes", 95: "con tormenta eléctrica", 96: "con tormenta y granizo", 99: "con tormenta y granizo",
};

async function consultarClima({ ciudad } = {}) {
  const nombre = (ciudad || CIUDAD).trim();
  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nombre)}&count=5&language=es`).then((r) => r.json());
  const lugares = geo.results || [];
  const lugar = lugares.find((l) => l.country_code === "CO") || lugares[0];
  if (!lugar) return { error: `No encontré la ciudad ${nombre}.` };

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lugar.latitude}&longitude=${lugar.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=3`;
  const d = await fetch(url).then((r) => r.json());
  const c = d.current || {};
  const dias = (d.daily?.time || []).map((fecha, i) => ({
    fecha,
    estado: CLIMA_CODIGOS[d.daily.weather_code[i]] || "variable",
    maxima_c: d.daily.temperature_2m_max[i],
    minima_c: d.daily.temperature_2m_min[i],
    probabilidad_lluvia_pct: d.daily.precipitation_probability_max[i],
  }));
  return {
    lugar: [lugar.name, lugar.admin1, lugar.country].filter(Boolean).join(", "),
    ahora: {
      estado: CLIMA_CODIGOS[c.weather_code] || "variable",
      temperatura_c: c.temperature_2m,
      sensacion_c: c.apparent_temperature,
      humedad_pct: c.relative_humidity_2m,
      viento_kmh: c.wind_speed_10m,
      lluvia_mm: c.precipitation,
    },
    proximos_dias: dias,
  };
}

const HERRAMIENTA_CLIMA = {
  name: "consultar_clima",
  description: "Clima actual y pronóstico de 3 días para una ciudad. Úsala cuando pregunten por el clima, la temperatura, si va a llover o si hace calor.",
  input_schema: {
    type: "object",
    properties: { ciudad: { type: "string", description: `Ciudad a consultar. Si no la mencionan, ${CIUDAD}.` } },
  },
};

const HERRAMIENTA_BUSQUEDA = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 3,
  user_location: { type: "approximate", city: CIUDAD, country: "CO", timezone: "America/Bogota" },
};

// ---------- Utilidades ----------
function limpiarMensajes(lista) {
  if (!Array.isArray(lista)) return [];
  const salida = [];
  for (const m of lista.slice(-20)) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
    if (typeof m.content !== "string" || !m.content.trim()) continue;
    const texto = m.content.trim().slice(0, 3000);
    const ultimo = salida[salida.length - 1];
    if (ultimo && ultimo.role === m.role) ultimo.content += "\n" + texto;
    else salida.push({ role: m.role, content: texto });
  }
  while (salida.length && salida[0].role !== "user") salida.shift();
  return salida;
}

async function llamarClaude(apiKey, mensajes, conBusqueda) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || MODELO_POR_DEFECTO,
      max_tokens: 900,
      system: promptSistema(),
      tools: conBusqueda ? [HERRAMIENTA_CLIMA, HERRAMIENTA_BUSQUEDA] : [HERRAMIENTA_CLIMA],
      messages: mensajes,
    }),
  });
  const datos = await r.json().catch(() => ({}));
  return { ok: r.ok, estado: r.status, datos };
}

const ETIQUETA = /\[\s*(feliz|riendo|gui[nñ]o|enamorada|sorprendida|sonrisa|pensando)\s*\]/gi;

function extraerExpresion(contenido) {
  const crudo = (contenido || []).filter((b) => b.type === "text").map((b) => b.text).join(" ");
  const m = crudo.match(/\[\s*(feliz|riendo|gui[nñ]o|enamorada|sorprendida|sonrisa|pensando)\s*\]/i);
  const expresion = m ? m[1].toLowerCase().replace("ñ", "n") : "sonrisa";
  return { expresion, texto: crudo.replace(ETIQUETA, " ") };
}

function textoParaVoz(texto) {
  return String(texto || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*#_`>\[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------- Manejador ----------
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Usa POST." }); }

  const pin = process.env.ROBOT_PIN;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!pin || !apiKey) return res.status(500).json({ error: "Faltan variables en Vercel: ANTHROPIC_API_KEY y/o ROBOT_PIN.", codigo: "config" });
  if (req.headers["x-robot-pin"] !== pin) return res.status(401).json({ error: "PIN incorrecto.", codigo: "pin" });

  let cuerpo = req.body;
  if (typeof cuerpo === "string") { try { cuerpo = JSON.parse(cuerpo || "{}"); } catch { cuerpo = {}; } }
  const mensajes = limpiarMensajes(cuerpo?.messages);
  if (!mensajes.length || mensajes[mensajes.length - 1].role !== "user") return res.status(400).json({ error: "No llegó ninguna pregunta." });

  let conBusqueda = (process.env.WEB_SEARCH || "on").toLowerCase() !== "off";

  try {
    // Ciclo de herramientas: Claude puede pedir el clima o buscar en la web antes de responder
    for (let vuelta = 0; vuelta < 5; vuelta++) {
      let r = await llamarClaude(apiKey, mensajes, conBusqueda);

      // Si la búsqueda web no está habilitada en la organización, sigue sin ella
      if (!r.ok && conBusqueda && r.estado === 400 && /web.?search/i.test(JSON.stringify(r.datos))) {
        console.warn("Búsqueda web no disponible; sigo sin ella.");
        conBusqueda = false;
        r = await llamarClaude(apiKey, mensajes, false);
      }
      if (!r.ok) {
        console.error("Error de Anthropic", r.estado, JSON.stringify(r.datos).slice(0, 500));
        return res.status(502).json({ error: "El agente no respondió.", detalle: r.datos?.error?.message || r.estado });
      }

      const { content, stop_reason } = r.datos;

      if (stop_reason === "tool_use") {
        mensajes.push({ role: "assistant", content });
        const resultados = [];
        for (const bloque of content.filter((b) => b.type === "tool_use")) {
          let salida;
          try {
            salida = bloque.name === "consultar_clima" ? await consultarClima(bloque.input) : { error: "Herramienta desconocida." };
          } catch (e) {
            console.error("Error de herramienta", bloque.name, e);
            salida = { error: "No pude consultar el clima en este momento." };
          }
          resultados.push({ type: "tool_result", tool_use_id: bloque.id, content: JSON.stringify(salida) });
        }
        mensajes.push({ role: "user", content: resultados });
        continue;
      }

      if (stop_reason === "pause_turn") { // búsqueda web larga: se continúa el mismo turno
        mensajes.push({ role: "assistant", content });
        continue;
      }

      const { expresion, texto } = extraerExpresion(content);
      const respuesta = textoParaVoz(texto);
      return res.status(200).json({ reply: respuesta || "Perdón, no te entendí. ¿Me lo repites?", expresion });
    }
    return res.status(200).json({ reply: "Uy, me enredé buscando eso. ¿Me lo preguntas de otra forma?" });
  } catch (e) {
    console.error("Fallo de red", e);
    return res.status(502).json({ error: "No pude conectar con el agente." });
  }
}
