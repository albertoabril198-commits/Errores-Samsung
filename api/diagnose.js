import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code, deviceType } = req.body;

    // 1. Configuramos la API forzando la versión 'v1'
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // 2. Obtenemos el modelo especificando que use la versión estable
    // Pasamos un segundo argumento opcional para asegurar la API v1
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: 'v1' } 
    );

    const prompt = `Eres experto en aire acondicionado Samsung. 
    Analiza el error "${code}" para "${deviceType}".
    Responde en JSON:
    {
      "code": "${code}",
      "title": "Nombre",
      "description": "Significado",
      "possibleCauses": ["causa"],
      "steps": ["paso"],
      "severity": "Media"
    }`;

    // 3. Llamada directa
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error detectado:", error);
    return res.status(500).json({ 
      error: "Error de comunicación con Google AI Studio",
      details: error.message 
    });
  }
}