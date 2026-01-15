import { GoogleGenerativeAI } from "@google/generative-ai";

// Usamos la clave que ya tienes configurada
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const getDiagnose = async (code, deviceType) => {
  try {
    // Usamos el modelo que funcionaba originalmente
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Eres un técnico experto en Samsung HVAC. 
    Diagnostica el error "${code}" para el equipo "${deviceType}". 
    Responde estrictamente en formato JSON:
    {
      "code": "${code}",
      "title": "Nombre del error",
      "description": "Explicación",
      "possibleCauses": ["causa 1"],
      "steps": ["paso 1"],
      "severity": "Media"
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error en Gemini Service:", error);
    throw error;
  }
};