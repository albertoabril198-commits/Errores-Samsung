import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { code, deviceType } = req.body;

    // 1. Configuración de Gemini (Usando la última versión del SDK)
    const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    
    // Configuramos el modelo para usar la herramienta de Google Search
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [
        {
          googleSearchRetrieval: {}, // Esto activa la búsqueda en Google
        },
      ],
    });

    // 2. Prompt optimizado
    // Hemos añadido una instrucción para que priorice la búsqueda web técnica
    const prompt = `
      Actúa como un ingeniero de servicio técnico oficial de Samsung HVAC.
      Busca en la red la información más reciente sobre el siguiente error:
      
      Equipo: ${deviceType}
      Código de Error: ${code}

      Instrucciones:
      - Busca manuales de servicio oficiales de Samsung y boletines técnicos.
      - Proporciona una solución precisa.
      - Responde estrictamente en formato JSON.

      Estructura de respuesta:
      {
        "code": "${code}",
        "title": "Nombre corto del error",
        "description": "Explicación detallada de qué significa el error según el manual",
        "possibleCauses": ["causa 1", "causa 2"],
        "steps": ["paso 1 para solucionar", "paso 2 para solucionar"],
        "severity": "Alta/Media/Baja"
      }
    `;

    // 3. Ejecución de la IA con búsqueda activa
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpieza de formato Markdown
    text = text.replace(/```json|```/g, "").trim();

    // Intentamos parsear la respuesta
    const jsonResponse = JSON.parse(text);
    res.status(200).json(jsonResponse);

  } catch (error) {
    console.error("Error en Gemini con búsqueda web:", error);
    res.status(500).json({ 
      error: "Error al consultar el diagnóstico",
      details: error.message 
    });
  }
}