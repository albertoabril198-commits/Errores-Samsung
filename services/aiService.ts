export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Configuración incompleta: Falta la API Key.");

  // URL estable v1
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Eres experto en Samsung HVAC. Diagnostica el error "${code}" en el equipo "${deviceType}". Info extra: ${extraInfo}. 
        Responde exclusivamente en formato JSON con estas llaves: code, title, description, possibleCauses (array), steps (array), severity.`
      }]
    }]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Google dice: ${data.error?.message || 'Error de conexión'}`);
  }

  try {
    // Esta línea limpia el posible markdown (```json ...) que devuelve la IA
    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (e) {
    throw new Error("La IA devolvió un formato no válido. Inténtalo de nuevo.");
  }
};