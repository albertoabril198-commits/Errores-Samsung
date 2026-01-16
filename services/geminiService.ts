export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) throw new Error("API Key no configurada");

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Eres experto en Samsung HVAC. Diagnostica el error "${code}" para "${deviceType}". Info: ${extraInfo}. Responde solo JSON: {"code": "${code}", "title": "...", "description": "...", "possibleCauses": [], "steps": [], "severity": "Media"}`
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
    throw new Error(data.error?.message || "Error en la IA");
  }

  const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
};