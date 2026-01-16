export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Si esto sale en pantalla, es que Vercel no tiene la variable VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("LA APP NO VE LA CLAVE. Revisa en Vercel que el nombre sea VITE_GEMINI_API_KEY");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Eres experto en Samsung HVAC. Diagnostica el error "${code}" para "${deviceType}". Info extra: ${extraInfo}. Responde solo JSON: {"code": "${code}", "title": "Nombre", "description": "Explicación", "possibleCauses": [], "steps": [], "severity": "Media"}`
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
      // Esto nos dirá el error real de Google (ej: API Key invalid)
      throw new Error(`Google responde: ${data.error?.message || 'Error desconocido'}`);
    }

    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error: any) {
    // Esto mostrará cualquier otro error técnico
    throw new Error(error.message);
  }
};