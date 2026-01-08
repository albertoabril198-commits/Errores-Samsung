import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;

    // 1. IA Config - CORRECCIÓN CRÍTICA: Quitamos "models/" del nombre
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Google Drive Config
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 3. Obtener Manual
    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
      pageSize: 1
    });

    let context = "No se pudo extraer texto del manual.";
    if (driveRes.data.files && driveRes.data.files.length > 0) {
      const fileId = driveRes.data.files[0].id;
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      const pdfData = await pdf(Buffer.from(response.data));
      context = pdfData.text.substring(0, 8000); // Reducido para mayor estabilidad
    }

    // 4. Prompt y Respuesta de Gemini
    const prompt = `Como experto Samsung HVAC, resuelve el error ${code} para ${deviceType}.
    Contexto manual: ${context}
    Responde estrictamente en JSON:
    {
      "code": "${code}",
      "title": "Nombre",
      "description": "Explicación",
      "possibleCauses": ["causa"],
      "steps": [{"instruction": "paso", "detail": "detalle"}],
      "severity": "medium"
    }`;

    // Generación con manejo de respuesta asíncrona correcto
    const result = await model.generateContent(prompt);
    const responseIA = await result.response;
    let textIA = responseIA.text().trim();
    
    // Limpieza de Markdown
    textIA = textIA.replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(textIA));

  } catch (error) {
    console.error("ERROR DETECTADO:", error);
    // Enviamos el mensaje real a la App para saber si es la API Key
    return res.status(500).json({ 
      error: "Fallo en diagnóstico", 
      message: error.message 
    });
  }
}