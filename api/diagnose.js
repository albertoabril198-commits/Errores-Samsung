import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, deviceType } = req.body;

    // 1. Inicialización limpia
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // 2. Usamos el alias 'latest' que fuerza a la API a encontrar la versión activa
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest" 
    });

    const prompt = `Actúa como soporte técnico de Samsung HVAC. 
    Analiza el error "${code}" para el equipo "${deviceType}".
    Responde estrictamente en formato JSON:
    {
      "code": "${code}",
      "title": "Nombre del error",
      "description": "Explicación",
      "possibleCauses": ["causa 1"],
      "steps": ["paso 1"],
      "severity": "Media"
    }`;

    // 3. Generación de contenido
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ 
      error: "Error de comunicación con la IA",
      details: error.message 
    });
  }
}