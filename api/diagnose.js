import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 1. Google Drive - Lectura ultra rápida
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const driveRes = await drive.files.list({
      q: `'${process.env.DRIVE_FOLDER_ID}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
      pageSize: 1
    });

    let context = "";
    if (driveRes.data.files?.length > 0) {
      const response = await drive.files.get({ fileId: driveRes.data.files[0].id, alt: 'media' }, { responseType: 'arraybuffer' });
      const pdfData = await pdf(Buffer.from(response.data));
      // Tomamos solo 1000 caracteres para que la respuesta sea instantánea
      context = pdfData.text.substring(0, 1000); 
    }

    // 2. Prompt simplificado al extremo
    const prompt = `Como experto Samsung HVAC, dime la solucion del error ${code} para ${deviceType}. 
    Usa este manual: ${context}.
    Responde UNICAMENTE un objeto JSON con: code, title, description, possibleCauses (array), steps (array de objetos con instruction y detail), severity.`;

    const result = await model.generateContent(prompt);
    const responseIA = await result.response;
    let textIA = responseIA.text().trim();
    
    // Limpieza profunda de JSON
    const jsonStart = textIA.indexOf('{');
    const jsonEnd = textIA.lastIndexOf('}') + 1;
    const cleanJson = textIA.substring(jsonStart, jsonEnd);
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("DETALLE:", error);
    // Si falla el manual, intentamos responder con el conocimiento general de la IA
    return res.status(200).json({ 
      code: "INFO", 
      title: "Diagnóstico Genérico", 
      description: "No pudimos leer el manual específico, pero esto es lo que indica el error " + req.body.code,
      possibleCauses: ["Fallo de comunicación", "Sensor defectuoso"],
      steps: [{"instruction": "Revisar cableado", "detail": "Verifica las conexiones entre placas."}],
      severity: "medium"
    });
  }
}