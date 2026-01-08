import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;

    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    // Cambiamos a flash-lite que tiene cuotas más relajadas
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
      pageSize: 1
    });

    let context = "No se pudo extraer texto.";
    if (driveRes.data.files && driveRes.data.files.length > 0) {
      const fileId = driveRes.data.files[0].id;
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      const pdfData = await pdf(Buffer.from(response.data));
      context = pdfData.text.substring(0, 5000); 
    }

    const prompt = `Experto Samsung HVAC. Error ${code}, equipo ${deviceType}. Manual: ${context}. Responde solo JSON: {"code":"${code}","title":"Nombre","description":"Info","possibleCauses":["Causa"],"steps":[{"instruction":"Paso","detail":"Info"}],"severity":"medium"}`;

    const result = await model.generateContent(prompt);
    const responseIA = await result.response;
    let textIA = responseIA.text().trim().replace(/```json|```/g, "");
    
    return res.status(200).json(JSON.parse(textIA));

  } catch (error) {
    console.error("ERROR DETECTADO:", error);
    // Si es error de cuota, avisamos al usuario
    if (error.status === 429) {
      return res.status(429).json({ error: "Límite alcanzado", message: "Espera 1 minuto y vuelve a intentar." });
    }
    return res.status(500).json({ error: "Error de servidor", message: error.message });
  }
}