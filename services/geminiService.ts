export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("LA APP NO VE LA CLAVE. Revisa Vercel.");
  }

  // FORZAMOS v1 y gemini-1.5-flash (Sin el -latest y sin v1beta)
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Actúa como soporte técnico de Samsung HVAC. Diagnostica el error "${code}" para "${deviceType}". Info extra: ${extraInfo}. Responde solo JSON: {"code": "${code}", "title": "Nombre", "description": "Explicación", "possibleCauses": [], "steps": [], "severity": "Media"}`
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
      throw new Error(`Google responde (${response.status}): ${data.error?.message || 'Error desconocido'}`);
    }

    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error: any) {
    throw new Error(error.message);
  }
};