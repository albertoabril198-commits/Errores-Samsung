export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key no detectada.");

  // URL ACTUALIZADA A GEMINI 3 (según tu captura de pantalla)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Eres experto en soporte técnico de Samsung HVAC. 
        Diagnostica el error "${code}" para el equipo "${deviceType}". 
        Información adicional: ${extraInfo}.
        Responde exclusivamente en formato JSON con esta estructura: 
        {"code": "${code}", "title": "Nombre del Error", "description": "Explicación", "possibleCauses": ["causa 1"], "steps": ["paso 1"], "severity": "Media"}`
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
      throw new Error(`Google responde: ${data.error?.message || 'Error en el modelo Gemini 3'}`);
    }

    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error: any) {
    throw new Error(error.message);
  }
};