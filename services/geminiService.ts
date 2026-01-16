import { GoogleGenerativeAI } from "@google/generative-ai";

export const diagnoseError = async (code: string, deviceType: string, extraInfo: string) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // DEBUG: Esto te permitirá ver en la consola del navegador si la clave existe
  // (No te preocupes, en producción nadie lo verá si no abre la consola)
  console.log("¿API Key detectada?:", apiKey ? "SÍ" : "NO");

  if (!apiKey) {
    throw new Error("La aplicación no detecta la clave VITE_GEMINI_API_KEY. Verifica Vercel.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Usamos el nombre del modelo más estable
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    console.error("Error detallado de Google:", error);
    throw new Error(`Error de Google: ${error.message}`);
  }
};