import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, deviceType } = req.body;

    if (!code || !deviceType) {
      return res.status(400).json({ error: "Faltan datos en la petición" });
    }

    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{ googleSearchRetrieval: {} }],
    });

    const prompt = `Actúa como soporte técnico de Samsung HVAC. 
    Busca el error "${code}" para el equipo "${deviceType}". 
    Responde en JSON: {"code": "${code}", "title": "", "description": "", "possibleCauses": [], "steps": [], "severity": ""}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json|```/g, "").trim();
    const jsonResponse = JSON.parse(text);
    
    return res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Error detallado:", error);
    return res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
}