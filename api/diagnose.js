import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { code, deviceType } = req.body;

    // 1. Configuración de Gemini
    const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY);
    // Usamos gemini-1.5-flash por su rapidez y precisión en tareas técnicas
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Prompt optimizado para diagnóstico técnico
    const prompt = `
      Eres un técnico experto senior de Samsung HVAC (Aire Acondicionado).
      Tu tarea es diagnosticar el siguiente error:
      
      Equipo: ${deviceType}
      Código de Error: ${code}

      Instrucciones:
      - Utiliza tu base de conocimientos sobre manuales técnicos de Samsung (RAC, DVM, Multi-Split, etc.).
      - Proporciona una solución precisa basada en el manual de servicio.
      - Si el código es genérico, ofrece las causas más probables para este modelo específico.

      Responde estrictamente en formato JSON con la siguiente estructura:
      {
        "code": "${code}",
        "title": "Nombre corto del error",
        "description": "Explicación detallada de qué significa el error",
        "possibleCauses": ["causa 1", "causa 2"],
        "steps": ["paso 1 para solucionar", "paso 2 para solucionar"],
        "severity": "Alta/Media/Baja"
      }
    `;

    // 3. Ejecución de la IA
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpieza de posibles etiquetas de markdown que Gemini a veces añade
    text = text.replace(/```json|```/g, "").trim();

    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error en Gemini:", error);
    res.status(500).json({ error: "Error al consultar el diagnóstico con la IA" });
  }
}