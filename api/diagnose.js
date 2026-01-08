import { google } from 'googleapis';
import { GoogleGenAI } from "@google/genai";
import pdf from 'pdf-parse';

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

    // 2. Obtener TODOS los archivos de la carpeta "google ia"
    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
    });

    let contextFromManuals = "";

    // 3. Leer el contenido de los manuales (limitamos a los 3 primeros para no saturar)
    const filesToRead = driveRes.data.files.slice(0, 3);
    
    for (const file of filesToRead) {
      const response = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      const pdfData = await pdf(Buffer.from(response.data));
      // Buscamos si el código de error aparece en este manual
      if (pdfData.text.includes(code)) {
        contextFromManuals += `\n--- CONTENIDO DEL MANUAL ${file.name} ---\n${pdfData.text}\n`;
      }
    }

    // 4. Consulta a Gemini con el contexto real
    const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Pro es mejor para leer manuales largos

    const prompt = `
      Eres el soporte técnico oficial de Samsung HVAC.
      Tu tarea es resolver el error "${code}" para un equipo "${deviceType}".
      
      A continuación tienes fragmentos extraídos de los manuales técnicos guardados en Drive:
      ${contextFromManuals || "No se encontró el código exacto en los manuales, usa tu base de datos interna de Samsung."}
      
      Instrucciones:
      - Si el error está en el texto de arriba, prioriza esa solución.
      - Responde con pasos técnicos precisos.
      
      Responde estrictamente en formato JSON:
      {
        "code": "${code}",
        "title": "Nombre del error",
        "description": "Qué está pasando",
        "possibleCauses": ["causa 1", "causa 2"],
        "steps": [{ "instruction": "Paso 1", "detail": "Cómo hacerlo" }],
        "severity": "high"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "");
    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ error: "Error analizando los manuales de Samsung" });
  }
}