import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Cabeceras básicas
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code, deviceType } = req.body;

    // 2. Inicialización limpia (La que funcionó al principio)
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // Usamos el modelo base sin configuraciones adicionales de herramientas
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Actúa como un experto técnico de Samsung HVAC. 
    Analiza el error "${code}" para el equipo "${deviceType}".
    Proporciona el significado del error, causas probables y pasos para resolverlo.
    Responde estrictamente en formato JSON con esta estructura:
    {
      "code": "${code}",
      "title": "...",
      "description": "...",
      "possibleCauses": ["..."],
      "steps": ["..."],
      "severity": "..."
    }`;

    // 3. Ejecución directa
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpiamos el texto por si Gemini añade formato markdown
    text = text.replace(/```json|```/g, "").trim();

    // 4. Enviamos la respuesta
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error en la IA:", error);
    return res.status(500).json({ 
      error: "Error al generar el diagnóstico", 
      details: error.message 
    });
  }
}