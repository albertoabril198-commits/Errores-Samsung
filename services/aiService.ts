export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key no detectada.");

  try {
    // 1. PASO DE AUTO-DETECCIÓN: Listamos tus modelos disponibles
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listRes.ok) throw new Error("No se pudo conectar con Google para listar modelos.");

    // Buscamos un modelo que soporte 'generateContent' (preferiblemente Flash o Gemini 3)
    const availableModel = listData.models.find((m: any) => 
      m.supportedGenerationMethods.includes("generateContent") && 
      (m.name.includes("flash") || m.name.includes("gemini-3"))
    );

    if (!availableModel) throw new Error("No se encontró un modelo compatible en tu cuenta.");

    const modelName = availableModel.name; // Ejemplo: "models/gemini-1.5-flash-002" o similar
    console.log("Usando modelo detectado:", modelName);

    // 2. PETICIÓN DE DIAGNÓSTICO con el modelo real detectado
    const diagUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(diagUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Eres experto en Samsung HVAC. Diagnostica el error "${code}" en "${deviceType}". Info: ${extraInfo}. Responde solo JSON: {"code": "${code}", "title": "...", "description": "...", "possibleCauses": [], "steps": [], "severity": "Media"}`
          }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Error al generar contenido");

    const text = data.candidates[0].content.parts[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);

  } catch (error: any) {
    throw new Error("Error de Autodeteción: " + error.message);
  }
};