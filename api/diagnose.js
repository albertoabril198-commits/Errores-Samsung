import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { code, deviceType } = req.body;

    // 1. Validar variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.VITE_GEMINI_API_KEY) {
      return res.status(500).json({ error: "Faltan variables de entorno en Vercel." });
    }

    // 2. Configurar IA (Usando la nueva forma de importación)
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Configurar Google Drive
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 4. Buscar y leer PDF
    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
      pageSize: 1
    });

    let context = "No se encontró el manual en Drive.";
    if (driveRes.data.files && driveRes.data.files.length > 0) {
      const fileId = driveRes.data.files[0].id;
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      const pdfData = await pdf(Buffer.from(response.data));
      context = pdfData.text.substring(0, 10000);
    }

    // 5. Generar respuesta
    const prompt = `Como experto Samsung HVAC, resuelve el error ${code} para ${deviceType}.
    Manual: ${context}
    Responde SOLO JSON puro:
    {
      "code": "${code}",
      "title": "Nombre del Error",
      "description": "Explicación",
      "possibleCauses": ["causa"],
      "steps": [{"instruction": "paso", "detail": "detalle"}],
      "severity": "high"
    }`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim().replace(/```json|```/g, "");
    
    return res.status(200).json(JSON.parse(responseText));

  } catch (error) {
    console.error("ERROR REAL:", error);
    return res.status(500).json({ 
      error: "Error en el servidor", 
      message: error.message 
    });
  }
}