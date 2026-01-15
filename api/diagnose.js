export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { code, deviceType } = req.body;
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    // Construimos la URL manualmente para evitar el error 404 de la librería
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body = {
      contents: [{
        parts: [{
          text: `Eres un técnico experto en Samsung HVAC. Explica el error "${code}" para el equipo "${deviceType}". Responde estrictamente en formato JSON: {"code": "${code}", "title": "Nombre corto", "description": "Explicación", "possibleCauses": ["causa 1"], "steps": ["paso 1"], "severity": "Media"}`
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
      throw new Error(data.error?.message || 'Error en la API de Google');
    }

    // Extraemos el texto de la respuesta de Google
    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/```json|```/g, "").trim();

    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error diagnóstico:", error);
    return res.status(500).json({ error: "Fallo en la conexión", details: error.message });
  }
}