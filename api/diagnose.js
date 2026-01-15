import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code, deviceType } = req.body;
    
    // Inicialización directa
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // Probamos con gemini-1.5-pro, a veces el flash tiene restricciones en ciertas regiones
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Como experto Samsung HVAC, dime que significa el error ${code} en ${deviceType}. Responde solo JSON: {"code": "${code}", "title": "...", "description": "...", "possibleCauses": [], "steps": [], "severity": "Media"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error técnico:", error);
    return res.status(500).json({ error: error.message });
  }
}