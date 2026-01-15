import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code, deviceType } = req.body;
    
    // 1. Inicialización
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // 2. Usamos la ruta COMPLETA del modelo. 
    // En regiones con restricciones, esto es vital para evitar el 404.
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    const prompt = `Eres técnico de Samsung HVAC. Error: ${code}, Equipo: ${deviceType}. 
    Responde solo este JSON: {"code": "${code}", "title": "...", "description": "...", "possibleCauses": [], "steps": [], "severity": "Media"}`;

    // 3. Generación con reintentos internos
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error técnico:", error);
    // Si falla, intentamos devolver un error que nos dé más pistas
    return res.status(500).json({ 
      error: "Error de acceso a Gemini en tu región", 
      details: error.message 
    });
  }
}