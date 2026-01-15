import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, deviceType } = req.body;

    // 1. Inicializar con la API KEY
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // 2. IMPORTANTE: Usamos el nombre completo con el prefijo "models/" 
    // Esto es lo que resuelve el error 404 en la mayoría de los casos
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    const prompt = `Eres un experto en climatización Samsung.
    Diagnostica el error "${code}" para el equipo "${deviceType}".
    Responde ÚNICAMENTE en este formato JSON:
    {
      "code": "${code}",
      "title": "Nombre del error",
      "description": "Significado",
      "possibleCauses": ["causa 1"],
      "steps": ["paso 1"],
      "severity": "Media"
    }`;

    // 3. Generar contenido
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpieza de JSON
    text = text.replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Detalle del error:", error);
    return res.status(500).json({ 
      error: "Error de conexión con la IA",
      message: error.message 
    });
  }
}