import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
  // Encabezados para evitar problemas de CORS y formato
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { code, deviceType } = req.body;

    // 1. Configuración de IA con el modelo más ligero disponible (8B)
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-8b" 
    });

    // 2. Configuración de Google Drive
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 3. Obtener el manual desde la carpeta de Drive
    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
      pageSize: 1
    });

    let context = "Información del manual no disponible.";
    if (driveRes.data.files && driveRes.data.files.length > 0) {
      const fileId = driveRes.data.files[0].id;
      const response = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      const pdfData = await pdf(Buffer.from(response.data));
      // Reducimos el contexto a 2000 caracteres para asegurar que la API no rechace la petición
      context = pdfData.text.substring(0, 2000);
    }

    // 4. Prompt optimizado para respuesta JSON rápida
    const prompt = `Eres un experto en climatización Samsung. 
    Analiza el error ${code} para el equipo ${deviceType}. 
    Contexto del manual: ${context}
    Responde ÚNICAMENTE en formato JSON siguiendo esta estructura:
    {
      "code": "${code}",
      "title": "Nombre corto del error",
      "description": "Explicación breve",
      "possibleCauses": ["Causa 1", "Causa 2"],
      "steps": [{"instruction": "Paso 1", "detail": "Cómo hacerlo"}],
      "severity": "high/medium/low"
    }`;

    // 5. Llamada a la IA
    const result = await model.generateContent(prompt);
    const responseIA = await result.response;
    let textIA = responseIA.text().trim();
    
    // Limpieza de posibles etiquetas de Markdown
    textIA = textIA.replace(/```json|```/g, "").trim();
    
    const parsedResponse = JSON.parse(textIA);
    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error("ERROR DETECTADO:", error);
    
    // Si el error es de cuota (429), enviamos un mensaje claro al frontend
    if (error.status === 429 || error.message?.includes('429')) {
      return res.status(429).json({ 
        error: "Límite de Google alcanzado", 
        message: "Por favor, espera 60 segundos antes de intentar otro código." 
      });
    }

    return res.status(500).json({ 
      error: "Error interno del servidor", 
      message: error.message 
    });
  }
}