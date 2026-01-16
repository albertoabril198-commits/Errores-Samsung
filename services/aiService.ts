export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key no detectada en Vercel.");

  // URL estable (v1) - Esto ELIMINA el error de v1beta
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Eres soporte técnico de Samsung HVAC. Analiza error "${code}" en "${deviceType}". Info: ${extraInfo}. Responde solo JSON: {"code": "${code}", "title": "...", "description": "...", "possibleCauses": [], "steps": [], "severity": "Media"}`
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
    // Si el error persiste, el mensaje DEBE cambiar y no dirá v1beta
    throw new Error(`Google responde: ${data.error?.message || 'Error desconocido'}`);
  }

  const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
};