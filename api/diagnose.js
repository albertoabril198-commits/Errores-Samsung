import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    // Usamos el modelo 2.0 que es el más rápido procesando textos largos
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // 1. Google Drive - Conexión rápida
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
      // AMPLIAMOS EL CONTEXTO: 6000 caracteres es el punto dulce entre precisión y tiempo
      context = pdfData.text.substring(0, 6000); 
    }

    // 2. Prompt de alta precisión técnica
    const prompt = `Actúa como un Ingeniero Senior de Samsung HVAC. 
    Analiza detalladamente el error "${code}" para el modelo "${deviceType}" usando esta base de conocimientos:
    ---
    ${context}
    ---
    Proporciona una solución técnica precisa. Responde ESTRICTAMENTE en JSON:
    {
      "code": "${code}",
      "title": "Nombre técnico",
      "description": "Explicación detallada",
      "possibleCauses": ["Causa técnica 1", "Causa técnica 2"],
      "steps": [{"instruction": "Paso técnico", "detail": "Explicación de cómo medir o comprobar"}],
      "severity": "high"
    }`;

    const result = await model.generateContent(prompt);
    const responseIA = await result.response;
    let textIA = responseIA.text().trim();
    
    // Limpieza de JSON robusta
    const cleanJson = textIA.substring(textIA.indexOf('{'), textIA.lastIndexOf('}') + 1);
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    console.error("LOG DE ERROR:", error);
    // Si realmente hay un timeout o fallo, devolvemos un error real para que lo veas en la consola
    return res.status(500).json({ 
      error: "Error de procesamiento", 
      message: "La IA no pudo procesar el manual a tiempo. Intenta con un código más específico." 
    });
  }
}