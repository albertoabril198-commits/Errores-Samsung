import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, deviceType } = req.body;

    if (!code || !deviceType) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // Cambiamos a la versión '002' que tiene mejor soporte para tools
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-002" 
    });

    const prompt = `
      Eres un experto en climatización Samsung. 
      Busca información actualizada en internet sobre el error "${code}" para un equipo "${deviceType}".
      Devuelve la respuesta estrictamente en este formato JSON:
      {
        "code": "${code}",
        "title": "Nombre del error",
        "description": "Significado",
        "possibleCauses": ["causa 1"],
        "steps": ["paso 1"],
        "severity": "Media"
      }
    `;

    // Pasamos las herramientas directamente en la generación del contenido
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearchRetrieval: {} }],
    });

    const response = await result.response;
    let text = response.text();
    
    // Limpieza de formato
    text = text.replace(/```json|```/g, "").trim();
    
    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error técnico:", error);
    res.status(500).json({ 
      error: "Error en el servidor", 
      details: error.message 
    });
  }
}