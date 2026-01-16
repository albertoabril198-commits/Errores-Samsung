export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) throw new Error("API Key no configurada");

  // CAMBIO: Usamos 'v1beta' pero con el modelo '-latest' que es el que acepta Google ahora
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Eres experto en Samsung HVAC. Diagnostica el error "${code}" para "${deviceType}". Info extra: ${extraInfo}. Responde solo JSON: {"code": "${code}", "title": "...", "description": "...", "possibleCauses": [], "steps": [], "severity": "Media"}`
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
      console.error("Error de Google:", data);
      throw new Error(data.error?.message || "Error en la IA");
    }

    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error: any) {
    throw new Error("El modelo de IA está actualizándose. Por favor, intenta de nuevo en un momento o revisa tu clave.");
  }
};