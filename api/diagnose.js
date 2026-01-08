import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;

    // USAMOS EL MODELO QUE TU LISTA DIJO QUE ESTÁ DISPONIBLE
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Configuración Drive
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // Buscar Manual
    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
      pageSize: 1
    });

    let context = "Manual no encontrado.";
    if (driveRes.data.files?.length > 0) {
      const fileId = driveRes.data.files[0].id;
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      const pdfData = await pdf(Buffer.from(response.data));
      context = pdfData.text.substring(0, 1500); // Muy corto para evitar errores
    }

    const prompt = `Samsung HVAC: Error ${code}, equipo ${deviceType}. Contexto: ${context}. Responde solo JSON: {"code":"${code}","title":"Nombre","description":"Explicación","possibleCauses":["Causa"],"steps":[{"instruction":"Paso","detail":"Detalle"}],"severity":"medium"}`;

    const result = await model.generateContent(prompt);
    const responseIA = await result.response;
    let textIA = responseIA.text().trim().replace(/```json|```/g, "");
    
    return res.status(200).json(JSON.parse(textIA));

  } catch (error) {
    console.error("ERROR:", error);
    return res.status(200).json({ 
      code: "Error", 
      title: "Reintentando...", 
      description: "La IA está tardando en responder. Por favor, pulsa el botón de nuevo en 10 segundos.",
      possibleCauses: ["Saturación de red"],
      steps: [{"instruction": "Reintentar", "detail": "Pulsa el botón de diagnóstico otra vez."}],
      severity: "low"
    });
  }
}