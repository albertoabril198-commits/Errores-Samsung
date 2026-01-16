export const diagnoseError = async (code: string, deviceType: string, extraInfo: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key no detectada.");

  try {
    // 1. PASO DE AUTO-DETECCIÓN
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listRes.ok) throw new Error("No se pudo conectar con Google.");

    const availableModel = listData.models.find((m: any) => 
      m.supportedGenerationMethods.includes("generateContent") && 
      (m.name.includes("flash") || m.name.includes("gemini-3"))
    );

    if (!availableModel) throw new Error("No se encontró un modelo compatible.");
    const modelName = availableModel.name;

    // 2. PETICIÓN DE DIAGNÓSTICO
    const diagUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(diagUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Eres experto en soporte técnico Samsung HVAC. 
            Diagnostica el error "${code}" para el equipo "${deviceType}". 
            Información adicional: ${extraInfo}.

            INSTRUCCIONES DE FORMATO:
            Responde ÚNICAMENTE con un objeto JSON.
            Es OBLIGATORIO que el campo "steps" contenga una lista de al menos 3 pasos detallados de reparación.

            Estructura requerida:
            {
              "code": "${code}",
              "title": "Nombre del error",
              "description": "Explicación técnica",
              "possibleCauses": ["causa 1", "causa 2"],
              "steps": ["Paso 1: Comprobar...", "Paso 2: Medir...", "Paso 3: Sustituir..."],
              "severity": "Alta"
            }`
          }]
        }],
        // Configuración para forzar una respuesta más creativa y detallada
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Error al generar contenido");

    // Limpieza de Markdown y parseo
    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json|```/g, "").trim();
    
    return JSON.parse(cleanJson);

  } catch (error: any) {
    throw new Error("Error en el diagnóstico: " + error.message);
  }
};