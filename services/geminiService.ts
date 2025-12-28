
import { GoogleGenAI, Type } from "@google/genai";
import { ErrorDiagnosis, DeviceType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const diagnoseError = async (code: string, deviceType: DeviceType): Promise<ErrorDiagnosis> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Actúa como un ingeniero senior de soporte técnico de Samsung HVAC. 
  Analiza el código de error "${code}" para un equipo de tipo "${deviceType}".
  Proporciona una explicación detallada y una guía de solución paso a paso.
  
  Instrucciones importantes:
  1. Si el código no es estándar, infiere el problema más probable basándote en la nomenclatura de Samsung.
  2. Incluye advertencias de seguridad eléctrica.
  3. Divide la solución en pasos técnicos claros y accionables.
  
  Responde estrictamente en formato JSON con la siguiente estructura:
  {
    "code": "${code}",
    "title": "Nombre técnico del error",
    "description": "Explicación de qué significa el error a nivel de sistema",
    "possibleCauses": ["causa 1", "causa 2"],
    "steps": [
      { "instruction": "Título del paso", "detail": "Explicación técnica detallada del paso" }
    ],
    "severity": "low" | "medium" | "high"
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  instruction: { type: Type.STRING },
                  detail: { type: Type.STRING }
                },
                required: ["instruction", "detail"]
              }
            },
            severity: { type: Type.STRING }
          },
          required: ["code", "title", "description", "possibleCauses", "steps", "severity"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as ErrorDiagnosis;
  } catch (error) {
    console.error("Error diagnosing HVAC issue:", error);
    throw new Error("No se pudo obtener el diagnóstico. Verifique el código de error e intente nuevamente.");
  }
};
