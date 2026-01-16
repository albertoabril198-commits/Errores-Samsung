export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key no detectada.");

  try {
    // 1. Detección automática del modelo (mantenemos esta lógica que ya te funciona)
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    const availableModel = listData.models.find((m: any) => 
      m.supportedGenerationMethods.includes("generateContent") && 
      (m.name.includes("flash") || m.name.includes("gemini-3") || m.name.includes("pro"))
    );

    if (!availableModel) throw new Error("No se encontró un modelo compatible.");
    const modelName = availableModel.name;

    // 2. Petición con el formato de objetos para los pasos
    const diagUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(diagUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Eres experto en soporte técnico de Samsung HVAC (climatización). 
            Diagnostica el error "${code}" para el equipo "${deviceType}". 
            Información adicional: ${extraInfo}.

            RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO.
            Es CRÍTICO que el campo "steps" sea una lista de objetos con "instruction" y "detail".

            Estructura exacta requerida:
            {
              "code": "${code}",
              "title": "Nombre técnico del error",
              "description": "Descripción detallada del fallo",
              "possibleCauses": ["Causa 1", "Causa 2"],
              "steps": [
                {
                  "instruction": "Título del paso 1 (Ej: Comprobación de tensión)",
                  "detail": "Explicación detallada de cómo realizar la medida y qué valores esperar."
                },
                {
                  "instruction": "Título del paso 2",
                  "detail": "Instrucciones técnicas precisas."
                }
              ],
              "severity": "Alta"
            }`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Error al generar contenido");

    // Limpieza de Markdown
    let text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("La IA no devolvió un formato JSON válido.");
    
    return JSON.parse(jsonMatch[0]);

  } catch (error: any) {
    console.error("Error en aiService:", error);
    throw new Error(error.message);
  }
};