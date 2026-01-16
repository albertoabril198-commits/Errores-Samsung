export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key no detectada.");

  // URL UNIVERSAL (v1beta + gemini-1.5-flash)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `Eres experto en Samsung HVAC. Diagnostica el error "${code}" en "${deviceType}". Info extra: ${extraInfo}. 
        Responde exclusivamente con un JSON que tenga: code, title, description, possibleCauses (lista), steps (lista), severity.`
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

    // Limpiador avanzado de respuesta
    let text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/); // Busca el primer { y el último }
    
    if (!jsonMatch) throw new Error("La IA no devolvió un formato JSON válido.");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    throw new Error(error.message);
  }
};