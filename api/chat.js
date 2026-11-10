// Agente Claude del robot de Ana C de Seguros.
// Variables: ANTHROPIC_API_KEY, ROBOT_PIN (obligatorias).
// Opcionales: CLAUDE_MODEL, ROBOT_CIUDAD (ciudad por defecto para clima y búsquedas), WEB_SEARCH=off para desactivar búsqueda web.

const MODELO_POR_DEFECTO = "claude-haiku-5-5"; // rápido, ideal para voz
const CIUDAD = process.env.ROBOT_CIUDAD || "Valledupar";
// Datos de la familia: se guardan en la variable VALERY_FAMILIA de Vercel, no en el código, para que no queden públicos en GitHub.
const FAMILIA = (process.env.VALERY_FAMILIA || "").trim();

function promptSistema(memoria = [], recados = []) {
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

${FAMILIA ? `La familia de Caro (información privada; úsala con cariño, con naturalidad y sin recitarla):
${FAMILIA}
- Calcula las edades con la fecha de hoy. Si hoy es el cumpleaños de alguien de la familia, felicítalo con mucha alegría; si un cumpleaños está a siete días o menos, menciónalo en el resumen del día.
- Con los niños habla según su edad: con el menor, juegos y palabras sencillas; con los mayores, más conversación. Siempre con respeto y cariño.
- De vez en cuando, sin exagerar y cuando venga al caso, recuérdale a Caro algo bonito de Camilo, su esposo, que fue quien te construyó como regalo para ella.

` : ""}Reconocimiento de caras: solo de la familia de Caro y con su permiso, nunca de clientes ni de desconocidos. Si te piden aprender la cara de alguien de la familia, pide que se ponga de frente a tu cámara y agrega [aprender_cara: Nombre]. Si te piden olvidar una cara, agrega [olvidar_cara: Nombre]. Si te preguntan "¿quién soy?" o quién está frente a ti, di algo corto como "déjame verte bien" y agrega [quien_es]; luego recibirás lo que vio tu cámara.

Herramientas de trabajo:
- Libreta de recados: cuando te pidan anotar un recado o algo pendiente ("anota que llamó Juan por el SOAT"), confírmalo y agrega al final [recado: quién y qué, corto]. Cuando digan que un recado ya se atendió, agrega [recado_hecho: palabras clave]. Si preguntan qué recados hay, léelos de la lista de recados pendientes.
- Cálculos: para cuotas, porcentajes, operaciones o días que faltan para una fecha usa SIEMPRE la herramienta calcular; nunca hagas cuentas de memoria. En Colombia las tasas de crédito suelen ser efectivas anuales (E.A.).
- Documentos: si te piden leer, revisar o resumir un documento, carta o póliza en papel, di que lo pongan frente a tu cámara y agrega [tomar_foto]. Cuando recibas la foto, resume en voz alta lo importante en pocas frases (quién, qué, fechas, valores, vencimientos) y no leas números de cédula ni de cuenta completos. Si la foto no se lee bien, pide que la acerquen y agrega [tomar_foto] otra vez.
- Resumen del día: si te piden el resumen del día o "qué hay para hoy", da un resumen corto: saludo, clima de hoy (usa consultar_clima), recados pendientes y pendientes que recuerdes. Todavía no tienes acceso a la agenda, el correo ni las pólizas; no los inventes.
- Reporte semanal: si te piden enviar el reporte de la semana, confírmalo y agrega [reporte].

Memoria de largo plazo: cuando Caro te cuente algo que valga la pena recordar en otros días (sus gustos, nombres de clientes frecuentes, pendientes, fechas importantes como cumpleaños), agrega al FINAL de tu respuesta una etiqueta [recordar: dato corto y claro]. Puedes poner varias. Nunca guardes cédulas, números de cuenta o tarjetas, claves, ni datos de salud de nadie. Si te pide olvidar algo puntual, agrega [olvidar: palabras clave del dato]; si te pide olvidar todo, agrega [olvidar_todo]. No menciones las etiquetas ni las leas en voz alta.
${recados.length ? "\nRecados pendientes:\n" + recados.map((r) => "- " + r).join("\n") + "\n" : "\nNo hay recados pendientes.\n"}${memoria.length ? "\nLo que recuerdas de días anteriores:\n" + memoria.map((m) => "- " + m).join("\n") + "\nUsa estos recuerdos con naturalidad cuando vengan al caso, sin recitarlos.\n" : ""}
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

// ---------- Herramienta de cálculo ----------
const HERRAMIENTA_CALCULAR = {
  name: "calcular",
  description: "Calculadora exacta. tipo 'expresion': operación aritmética (+ - * / paréntesis y %). tipo 'dias_hasta': días que faltan hasta una fecha. tipo 'cuota_mensual': cuota fija de un crédito o financiación.",
  input_schema: {
    type: "object",
    properties: {
      tipo: { type: "string", enum: ["expresion", "dias_hasta", "cuota_mensual"] },
      expresion: { type: "string", description: "Para 'expresion', p. ej. '1250000*0.19' o '(450000+120000)/12'." },
      fecha: { type: "string", description: "Para 'dias_hasta', en formato AAAA-MM-DD." },
      monto: { type: "number", description: "Para 'cuota_mensual', valor financiado en pesos." },
      meses: { type: "number", description: "Para 'cuota_mensual', número de cuotas." },
      tasa_ea_pct: { type: "number", description: "Para 'cuota_mensual', tasa efectiva anual en %, p. ej. 24." },
      tasa_mensual_pct: { type: "number", description: "Para 'cuota_mensual', tasa mensual en %, si se conoce en vez de la E.A." },
    },
    required: ["tipo"],
  },
};

function hoyBogota() {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return new Date(p + "T00:00:00Z");
}

function calcular(i = {}) {
  if (i.tipo === "expresion") {
    const e = String(i.expresion || "").replace(/,/g, ".").replace(/\s+/g, "");
    if (!e || !/^[0-9+\-*/().%]+$/.test(e)) return { error: "Expresión no válida." };
    const lista = e.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
    const valor = Function(`"use strict"; return (${lista});`)();
    if (!Number.isFinite(valor)) return { error: "El resultado no es un número." };
    return { resultado: Math.round(valor * 100) / 100 };
  }
  if (i.tipo === "dias_hasta") {
    const f = new Date(String(i.fecha || "") + "T00:00:00Z");
    if (isNaN(f)) return { error: "Fecha no válida; usa AAAA-MM-DD." };
    return { dias: Math.round((f - hoyBogota()) / 86400000), hoy: hoyBogota().toISOString().slice(0, 10) };
  }
  if (i.tipo === "cuota_mensual") {
    const P = Number(i.monto), n = Math.round(Number(i.meses));
    if (!(P > 0) || !(n > 0)) return { error: "Faltan el monto o los meses." };
    let r = 0;
    if (Number.isFinite(i.tasa_mensual_pct)) r = i.tasa_mensual_pct / 100;
    else if (Number.isFinite(i.tasa_ea_pct)) r = Math.pow(1 + i.tasa_ea_pct / 100, 1 / 12) - 1;
    const cuota = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n;
    return { cuota_mensual: Math.round(cuota), total_pagado: Math.round(cuota * n), intereses: Math.round(cuota * n - P), tasa_mensual_pct: Math.round(r * 10000) / 100 };
  }
  return { error: "Tipo de cálculo desconocido." };
}

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

async function llamarClaude(apiKey, mensajes, conBusqueda, memoria, recados) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || MODELO_POR_DEFECTO,
      max_tokens: 900,
      system: promptSistema(memoria, recados),
      tools: conBusqueda ? [HERRAMIENTA_CLIMA, HERRAMIENTA_CALCULAR, HERRAMIENTA_BUSQUEDA] : [HERRAMIENTA_CLIMA, HERRAMIENTA_CALCULAR],
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

function extraerMemoria(texto) {
  const recordar = [], olvidar = [];
  let olvidarTodo = false;
  const limpio = String(texto || "")
    .replace(/\[\s*recordar\s*:\s*([^\]]{2,200})\]/gi, (_, d) => { recordar.push(d.trim()); return " "; })
    .replace(/\[\s*olvidar_todo\s*\]/gi, () => { olvidarTodo = true; return " "; })
    .replace(/\[\s*olvidar\s*:\s*([^\]]{2,200})\]/gi, (_, d) => { olvidar.push(d.trim()); return " "; });
  return { recordar, olvidar, olvidarTodo, limpio };
}

function extraerAcciones(texto) {
  const recados = [], recadosHechos = [];
  let foto = false, reporte = false, aprenderCara = null, olvidarCara = null, quienEs = false;
  const limpio = String(texto || "")
    .replace(/\[\s*recado_hecho\s*:\s*([^\]]{2,200})\]/gi, (_, d) => { recadosHechos.push(d.trim()); return " "; })
    .replace(/\[\s*recado\s*:\s*([^\]]{2,200})\]/gi, (_, d) => { recados.push(d.trim()); return " "; })
    .replace(/\[\s*tomar_foto\s*\]/gi, () => { foto = true; return " "; })
    .replace(/\[\s*reporte\s*\]/gi, () => { reporte = true; return " "; })
    .replace(/\[\s*aprender_cara\s*:\s*([^\]]{2,60})\]/gi, (_, d) => { aprenderCara = d.trim(); return " "; })
    .replace(/\[\s*olvidar_cara\s*:\s*([^\]]{2,60})\]/gi, (_, d) => { olvidarCara = d.trim(); return " "; })
    .replace(/\[\s*quien_es\s*\]/gi, () => { quienEs = true; return " "; });
  return { recados, recadosHechos, foto, reporte, aprenderCara, olvidarCara, quienEs, limpio };
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
  const recados = Array.isArray(cuerpo?.recados)
    ? cuerpo.recados.filter((m) => typeof m === "string" && m.trim()).slice(-40).map((m) => m.trim().slice(0, 200))
    : [];
  // Foto de un documento: se adjunta a la última pregunta
  if (typeof cuerpo?.imagen === "string" && cuerpo.imagen.length > 100 && cuerpo.imagen.length < 4_000_000) {
    const ultimo = mensajes[mensajes.length - 1];
    ultimo.content = [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: cuerpo.imagen.replace(/^data:image\/\w+;base64,/, "") } },
      { type: "text", text: ultimo.content },
    ];
  }
  const memoria = Array.isArray(cuerpo?.memoria)
    ? cuerpo.memoria.filter((m) => typeof m === "string" && m.trim()).slice(-50).map((m) => m.trim().slice(0, 200))
    : [];
  if (!mensajes.length || mensajes[mensajes.length - 1].role !== "user") return res.status(400).json({ error: "No llegó ninguna pregunta." });

  let conBusqueda = (process.env.WEB_SEARCH || "on").toLowerCase() !== "off";

  try {
    // Ciclo de herramientas: Claude puede pedir el clima o buscar en la web antes de responder
    for (let vuelta = 0; vuelta < 5; vuelta++) {
      let r = await llamarClaude(apiKey, mensajes, conBusqueda, memoria, recados);

      // Si la búsqueda web no está habilitada en la organización, sigue sin ella
      if (!r.ok && conBusqueda && r.estado === 400 && /web.?search/i.test(JSON.stringify(r.datos))) {
        console.warn("Búsqueda web no disponible; sigo sin ella.");
        conBusqueda = false;
        r = await llamarClaude(apiKey, mensajes, false, memoria, recados);
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
            salida = bloque.name === "consultar_clima" ? await consultarClima(bloque.input)
              : bloque.name === "calcular" ? calcular(bloque.input)
              : { error: "Herramienta desconocida." };
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
      const { recordar, olvidar, olvidarTodo, limpio } = extraerMemoria(texto);
      const { recados: nuevosRecados, recadosHechos, foto, reporte, aprenderCara, olvidarCara, quienEs, limpio: limpio2 } = extraerAcciones(limpio);
      const respuesta = textoParaVoz(limpio2);
      return res.status(200).json({ reply: respuesta || "Perdón, no te entendí. ¿Me lo repites?", expresion, recordar, olvidar, olvidarTodo,
        recados: nuevosRecados, recadosHechos, foto, reporte, aprenderCara, olvidarCara, quienEs });
    }
    return res.status(200).json({ reply: "Uy, me enredé buscando eso. ¿Me lo preguntas de otra forma?" });
  } catch (e) {
    console.error("Fallo de red", e);
    return res.status(502).json({ error: "No pude conectar con el agente." });
  }
}
