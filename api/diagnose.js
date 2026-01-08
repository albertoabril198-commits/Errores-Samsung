import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js'; // Importación corregida para Vercel

export default async function handler(req, res) {
  // Aseguramos que la respuesta siempre sea JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;

    // 1. IA Config - Modificación del nombre del modelo para evitar el 404
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

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

    let context = "No se pudo extraer texto específico del manual.";
    if (driveRes.data.files && driveRes.data.files.length > 0) {
      const fileId = driveRes.data.files[0].id;
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      
      // Procesamos el PDF
      const pdfData = await pdf(Buffer.from(response.data));
      context = pdfData.text.substring(0, 12000); 
    }

    // 4. Prompt y Respuesta de Gemini
    const prompt = `Actúa como un experto técnico de Samsung HVAC.
    Resuelve el error ${code} para el equipo ${deviceType}.
    Usa este contexto del manual: ${context}
    
    Responde estrictamente en formato JSON puro:
    {
      "code": "${code}",
      "title": "Nombre del Error",
      "description": "Explicación breve",
      "possibleCauses": ["Causa 1"],
      "steps": [{"instruction": "Paso 1", "detail": "Detalle técnico"}],
      "severity": "medium"
    }`;

    // Generar contenido y esperar la respuesta completa
    const result = await model.generateContent(prompt);
    const responseIA = await result.response;
    let textIA = responseIA.text().trim();
    
    // Limpiamos Markdown si la IA lo incluye por error
    textIA = textIA.replace(/```json|```/g, "").trim();
    
    // Devolvemos el JSON parseado
    return res.status(200).json(JSON.parse(textIA));

  } catch (error) {
    console.error("ERROR DETECTADO:", error);
    return res.status(500).json({ 
      error: "Error interno del servidor", 
      message: error.message 
    });
  }
}