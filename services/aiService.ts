export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key no detectada.");

  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    const availableModel = listData.models.find((m: any) => 
      m.supportedGenerationMethods.includes("generateContent") && 
      (m.name.includes("flash") || m.name.includes("gemini-3") || m.name.includes("pro"))
    );

    if (!availableModel) throw new Error("No se encontró un modelo compatible.");
    const modelName = availableModel.name;

    const diagUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(diagUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Eres experto senior en Samsung HVAC. Diagnostica "${code}" para "${deviceType}". 
            Info: ${extraInfo}.
            Responde exclusivamente un objeto JSON. No uses caracteres especiales de control, saltos de línea ni tabulaciones dentro de los textos.
            Estructura:
            {
              "code": "${code}",
              "title": "Nombre",
              "description": "Explicación",
              "possibleCauses": [],
              "steps": [{"instruction": "...", "detail": "..."}],
              "severity": "Alta"
            }`
          }]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Error de Google");

    let text = data.candidates[0].content.parts[0].text;
    
    // --- ESCUDO DE LIMPIEZA PARA EL ERROR "Bad control character" ---
    // Esta línea busca el JSON y elimina caracteres de control invisibles (0-31 en ASCII)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Formato JSON no encontrado");
    
    const cleanJSON = jsonMatch[0].replace(/[\x00-\x1F\x7F-\x9F]/g, " "); 
    
    return JSON.parse(cleanJSON);

  } catch (error: any) {
    console.error("Error técnico:", error);
    throw new Error(error.message);
  }
};