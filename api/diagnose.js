import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Solo permitimos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, deviceType } = req.body;

    if (!code || !deviceType) {
      return res.status(400).json({ error: "Faltan datos: code o deviceType" });
    }

    // 1. Configuración de Gemini 
    // Usamos la API Key desde las variables de entorno de Vercel
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // IMPORTANTE: Usamos "models/gemini-1.5-flash" para evitar el error 404
    const model = genAI.getGenerativeModel({ 
      model: "models/gemini-1.5-flash",
      tools: [
        {
          googleSearchRetrieval: {}, // Activa la búsqueda en Google en tiempo real
        },
      ],
    });

    // 2. Prompt optimizado para búsqueda técnica externa
    const prompt = `
      Actúa como un Ingeniero de Soporte Técnico Senior de Samsung HVAC.
      Tu objetivo es encontrar información oficial sobre el siguiente error:
      
      EQUIPO: ${deviceType}
      CÓDIGO DE ERROR: ${code}

      INSTRUCCIONES:
      1. Realiza una búsqueda en la red para identificar el significado exacto de este código para este tipo de equipo Samsung.
      2. Basándote en manuales de servicio o boletines técnicos, ofrece una solución paso a paso.
      3. Responde ÚNICAMENTE en formato JSON siguiendo esta estructura:

      {
        "code": "${code}",
        "title": "Nombre breve del error",
        "description": "Explicación de qué significa el error",
        "possibleCauses": ["causa 1", "causa 2"],
        "steps": ["paso 1", "paso 2"],
        "severity": "Alta/Media/Baja"
      }
    `;