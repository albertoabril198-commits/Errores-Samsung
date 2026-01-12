import { google } from 'googleapis';
import { GoogleGenAI } from "@google/genai";
import pdf from 'pdf-parse'; // Nueva librería para leer el interior

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { code, deviceType } = req.body;

    // 1. Conexión a Drive
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 2. Buscar el manual más relevante (ej. que contenga "RAC" o "DVM")
    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and name contains '${deviceType}'`,
      fields: 'files(id, name)',
    });

    let manualText = "";
    if (driveRes.data.files.length > 0) {
      // Descargamos el primer manual encontrado para analizarlo
      const fileId = driveRes.data.files[0].id;
      const fileContent = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
      
      const pdfData = await pdf(Buffer.from(fileContent.data));
      manualText = pdfData.text.substring(0, 10000); // Enviamos los primeros 10k caracteres (suficiente para errores)
    }

    // 3. Consulta a Gemini con el TEXTO REAL del manual
    const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Eres un técnico experto de Samsung HVAC.
      Utiliza el siguiente extracto del manual técnico original:
      ---
      ${manualText}
      ---
      El equipo ${deviceType} tiene el error ${code}. 
      Si el error aparece en el texto anterior, da la solución exacta del manual.
      Si no aparece, usa tu conocimiento general pero advierte que es una estimación.
      
      Responde en JSON: { "code", "title", "description", "possibleCauses": [], "steps": [], "severity" }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "");
    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error analizando el manual" });
  }
}