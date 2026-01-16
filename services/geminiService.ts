import { GoogleGenerativeAI } from "@google/generative-ai";

export const diagnoseError = async (code: string, deviceType: string, extraInfo: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key no detectada.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // FORZAMOS LA VERSIÓN V1 AQUÍ:
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: 'v1' } // <-- Esto elimina el "v1beta" que causa el 404
    );

    const prompt = `Actúa como soporte técnico de Samsung HVAC. 
    Analiza el error "${code}" para el equipo "${deviceType}". 
    Info extra: ${extraInfo}.
    Responde estrictamente en formato JSON: 
    {"code": "${code}", "title": "Nombre", "description": "Explicación", "possibleCauses": [], "steps": [], "severity": "Media"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error detallado:", error);
    throw new Error("Error de conexión. Por favor, inténtalo de nuevo.");
  }
};