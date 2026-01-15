import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Manejo de CORS y método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, deviceType } = req.body;

    if (!code || !deviceType) {
      return res.status(400).json({ error: "Faltan datos (code o deviceType)" });
    }

    // 1. Inicialización
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // 2. Usamos el nombre del modelo estable
    // En la versión 0.24.1, a veces 'gemini-1.5-flash' a secas falla en Vercel
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Actúa como soporte técnico de Samsung HVAC. 
    Analiza el error "${code}" para el equipo "${deviceType}".
    Responde estrictamente en formato JSON con estas llaves: 
    "code", "title", "description", "possibleCauses", "steps", "severity".`;

    // 3. Generación de contenido simple (sin tools para evitar el 404)
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpieza de JSON
    text = text.replace(/```json|```/g, "").trim();
    
    // Intentar parsear y enviar
    const data = JSON.parse(text);
    return res.status(200).json(data);

  } catch (error) {
    console.error("Error en servidor:", error);
    return res.status(500).json({ 
      error: "Error al obtener el diagnóstico",
      details: error.message 
    });
  }
}