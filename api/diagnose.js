import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, deviceType } = req.body;

    // 1. Configuramos la API Key
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // 2. Forzamos el modelo gemini-1.5-flash
    // Eliminamos cualquier configuración de "tools" que pueda forzar a la v1beta
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    });

    const prompt = `Eres un soporte técnico experto en aire acondicionado Samsung.
    Proporciona el diagnóstico para el código de error "${code}" en el equipo "${deviceType}".
    Responde exclusivamente en formato JSON:
    {
      "code": "${code}",
      "title": "Nombre del error",
      "description": "Qué significa",
      "possibleCauses": ["causa 1"],
      "steps": ["paso 1"],
      "severity": "Media"
    }`;

    // 3. Ejecutamos la llamada
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error crítico:", error);
    
    // Si el error persiste, enviamos un mensaje más descriptivo
    return res.status(500).json({ 
      error: "Error en la comunicación con Google AI",
      details: error.message
    });
  }
}