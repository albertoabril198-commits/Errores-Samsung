import * as genai from "@google/generative-ai";
import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/drive.readonly'] });
    const drive = google.drive({ version: 'v3', auth });

    // Buscamos archivos TXT o PDF (pero priorizamos ligereza)
    const driveRes = await drive.files.list({
      q: `'${process.env.DRIVE_FOLDER_ID}' in parents`,
      fields: 'files(id, name, mimeType)',
      pageSize: 1
    });

    let context = "";
    if (driveRes.data.files?.length > 0) {
      const file = driveRes.data.files[0];
      const fileRes = await drive.files.get({ fileId: file.id, alt: 'media' });
      
      // Si el archivo es texto plano, la descarga es instantánea
      context = typeof fileRes.data === 'string' ? fileRes.data.substring(0, 10000) : "Contenido no legible directamente";
    }

    const prompt = `Como experto en Samsung HVAC, resuelve el error ${code} para ${deviceType}. Contexto: ${context}. Responde solo JSON.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    return res.status(500).json({ error: "Error de tiempo", message: "El manual es demasiado pesado para procesarlo en 10 segundos." });
  }
}