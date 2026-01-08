import * as genai from "@google/generative-ai";
import { google } from 'googleapis';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;

    // 1. IA Config - USAMOS EL NOMBRE MÁS ESTABLE Y ACTUALIZADO
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    // Cambiado de "models/gemini-1.5-flash" a solo "gemini-1.5-flash" 
    // La librería se encarga de añadir el prefijo correctamente.
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

    let context = "No se pudo extraer texto específico del manual.";
    if (driveRes.data.files && driveRes.data.files.length > 0) {
      const fileId = driveRes.data.files[0].id;
      const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      const pdfData = await pdf(Buffer.from(response.data));
      context = pdfData.text.substring(0, 10000); // Reducido un poco para evitar saturar la IA
    }

    // 4. Prompt y Respuesta de Gemini
    const prompt = `Actúa como técnico experto en Samsung HVAC.
    Analiza el error ${code} para el equipo ${deviceType}.
    Contexto: ${context}
    
    Responde ÚNICAMENTE en JSON:
    {
      "code": "${code}",
      "title": "Nombre del Error",
      "description": "Explicación",
      "possibleCauses": ["causa"],
      "steps": [{"instruction": "paso", "detail": "detalle"}],
      "severity": "medium"
    }`;

    // GENERACIÓN DE CONTENIDO
    const result = await model.generateContent(prompt);
    const responseIA = await result.response;
    let textIA = responseIA.text().trim();
    
    // Limpieza estricta de JSON
    textIA = textIA.replace(/```json|```/g, "").trim();
    
    return res.status(200).json(JSON.parse(textIA));

  } catch (error) {
    console.error("ERROR DETECTADO:", error);
    // Si el error es de Gemini (404), intentamos dar un mensaje más claro
    return res.status(500).json({ 
      error: "Error en la comunicación con la IA", 
      message: error.message 
    });
  }
}