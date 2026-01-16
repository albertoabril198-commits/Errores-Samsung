export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key no detectada en Netlify.");

  // CAMBIO SEGURO: Usamos la versión v1 y el modelo PRO que tiene mayor disponibilidad
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Eres experto en Samsung HVAC. Diagnostica el error "${code}" en "${deviceType}". Info extra: ${extraInfo}. 
        Responde exclusivamente con un objeto JSON con estas llaves: "code", "title", "description", "possibleCauses", "steps", "severity".`
      }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Google dice: ${data.error?.message || 'Error desconocido'}`);
    }

    // Limpiamos la respuesta de posibles bloques de código markdown
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return JSON.parse(text);
  } catch (error: any) {
    console.error(error);
    throw new Error("Error en el diagnóstico: " + error.message);
  }
};