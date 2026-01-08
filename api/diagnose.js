import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js'; // Importación corregida para Vercel

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;

    // 1. IA Config
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
      
      // Usamos el buffer directamente
      const pdfData = await pdf(Buffer.from(response.data));
      context = pdfData.text.substring(0, 12000); 
    }

    // 4. Prompt y Respuesta
    const prompt = `Como experto Samsung HVAC, resuelve el error ${code} para ${deviceType}.
    Información del manual: ${context}
    Responde estrictamente en JSON:
    {
      "code": "${code}",
      "title": "Nombre del Error",
      "description": "Explicación breve",
      "possibleCauses": ["Causa 1"],
      "steps": [{"instruction": "Paso 1", "detail": "Explicación"}],
      "severity": "medium"
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, "");
    
    return res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(500).json({ error: "Error en el servidor", message: error.message });
  }
}