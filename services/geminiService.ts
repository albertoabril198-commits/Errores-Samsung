import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializamos la IA
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const diagnoseError = async (code: string, deviceType: string, extraInfo: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Eres un técnico experto senior de Samsung HVAC.
      Diagnostica el siguiente error:
      Equipo: ${deviceType}
      Código: ${code}
      Información extra: ${extraInfo}

      Responde estrictamente en formato JSON:
      {
        "code": "${code}",
        "title": "Nombre corto del error",
        "description": "Explicación detallada",
        "possibleCauses": ["causa 1", "causa 2"],
        "steps": ["paso 1", "paso 2"],
        "severity": "Alta/Media/Baja"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json|```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error en el servicio Gemini:", error);
    throw new Error("No se pudo obtener el diagnóstico. Revisa tu conexión o la API Key.");
  }
};