export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  console.log("SISTEMA: Ejecutando versión V1 Estable"); // Si ves esto en la consola, el código es el nuevo
  
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key faltante.");

  // URL SIN BETA
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Diagnostica error Samsung HVAC: ${code}. Responde solo JSON.`
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
    throw new Error(`Error detectado: ${data.error?.message}`);
  }

  const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
};