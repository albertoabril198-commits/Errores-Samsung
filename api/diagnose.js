export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code, deviceType } = req.body;
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    // CAMBIO CLAVE: Usamos /v1/ en lugar de /v1beta/
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [{
        parts: [{
          text: `Actúa como soporte técnico de Samsung HVAC. Explica el error "${code}" para el equipo "${deviceType}". Responde exclusivamente en formato JSON con esta estructura: {"code": "${code}", "title": "Nombre", "description": "Explicación", "possibleCauses": ["causa 1"], "steps": ["paso 1"], "severity": "Media"}`
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Si Google devuelve un error, lo capturamos aquí
    if (!response.ok) {
      console.error("Respuesta de Google no OK:", data);
      throw new Error(data.error?.message || 'Error en la API de Google');
    }

    // Extraemos el texto
    if (!data.candidates || !data.candidates[0]) {
      throw new Error("La IA no devolvió resultados.");
    }

    let text = data.candidates[0].content.parts[0].text;
    
    // Limpieza de formato JSON por si acaso
    text = text.replace(/```json|```/g, "").trim();

    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error diagnóstico:", error);
    return res.status(500).json({ 
      error: "Fallo en la conexión técnica", 
      details: error.message 
    });
  }
}