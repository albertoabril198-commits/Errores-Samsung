import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js';

// Configuramos una caché simple fuera del handler para reutilizar la conexión de Drive
let driveClient = null;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // Iniciamos un temporizador de seguridad
  const startTime = Date.now();

  try {
    const { code, deviceType } = req.body;
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Autenticación rápida de Google
    if (!driveClient) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      driveClient = google.drive({ version: 'v3', auth });
    }

    let manualSnippet = "";
    
    // Ponemos un límite de tiempo: si Drive tarda más de 3 segundos, saltamos al diagnóstico directo
    try {
      const drivePromise = driveClient.files.list({
        q: `'${process.env.DRIVE_FOLDER_ID}' in parents and mimeType = 'application/pdf'`,
        fields: 'files(id, name)',
        pageSize: 1
      });

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Drive Timeout')), 3000));
      const driveRes = await Promise.race([drivePromise, timeoutPromise]);

      if (driveRes.data.files?.length > 0) {
        const fileRes = await driveClient.files.get({ fileId: driveRes.data.files[0].id, alt: 'media' }, { responseType: 'arraybuffer' });
        const pdfData = await pdf(Buffer.from(fileRes.data));
        manualSnippet = pdfData.text.substring(0, 2000); 
      }
    } catch (e) {
      console.log("Usando conocimiento interno (Drive fue muy lento)");
    }

    const prompt = `Samsung HVAC Error ${code} (${deviceType}). Manual snippet: ${manualSnippet}. 
    Responde en JSON: {"code":"${code}","title":"...","description":"...","possibleCauses":[],"steps":[],"severity":"..."}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response.text().substring(response.text().indexOf('{'), response.text().lastIndexOf('}') + 1);
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("Error final:", error);
    return res.status(500).json({ error: "Servidor saturado, reintenta." });
  }
}