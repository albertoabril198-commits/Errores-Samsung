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
    
    // Volvemos al modelo estándar que sabemos que responde
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Eres un Ingeniero experto en Climatización de Samsung (HVAC).
      Analiza el siguiente problema técnico:
      
      EQUIPO: ${deviceType}
      CÓDIGO DE ERROR: ${code}

      INSTRUCCIONES:
      1. Usa tu conocimiento de manuales de servicio Samsung (DVM S, CAC, RAC, FJM).
      2. Explica qué significa exactamente el error.
      3. Lista las causas más probables y los pasos de comprobación eléctrica/mecánica.
      4. Responde estrictamente en formato JSON:

      {
        "code": "${code}",
        "title": "Nombre del error",
        "description": "Explicación clara",
        "possibleCauses": ["causa 1", "causa 2"],
        "steps": ["comprobación 1", "comprobación 2"],
        "severity": "Alta/Media/Baja"
      }
    `;

    // Ejecución directa sin herramientas externas para evitar el 404
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpiar Markdown
    text = text.replace(/```json|```/g, "").trim();
    
    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error en el diagnóstico:", error);
    res.status(500).json({ 
      error: "Error al obtener diagnóstico", 
      details: error.message 
    });
  }
}