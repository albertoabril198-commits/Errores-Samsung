import { google } from 'googleapis';
import { GoogleGenAI } from "@google/generative-ai";
import pdf from 'pdf-parse';

export default async function handler(req, res) {
  // Forzamos que la respuesta siempre sea JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { code, deviceType } = req.body;

    // 1. Verificación de Variables de Entorno
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return res.status(500).json({ error: "Falta la variable GOOGLE_SERVICE_ACCOUNT_JSON en Vercel." });
    }

    let credentials;
    try {
      // Limpiamos posibles espacios en blanco alrededor del JSON
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
    } catch (e) {
      return res.status(500).json({ 
        error: "La variable GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido.",
        details: "Asegúrate de haber copiado las llaves { } y que no haya saltos de línea extraños."
      });
    }

    // 2. Configuración de Google Drive
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 3. Búsqueda de Manuales
    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
      pageSize: 2
    });

    let context = "No se encontró información específica en los manuales de Drive.";
    
    // 4. Lectura de PDF (con manejo de errores interno)
    if (driveRes.data.files && driveRes.data.files.length > 0) {
      try {
        const file = driveRes.data.files[0];
        const response = await drive.files.get(
          { fileId: file.id, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
        const pdfData = await pdf(Buffer.from(response.data));
        context = pdfData.text.substring(0, 15000); 
      } catch (pdfErr) {
        console.error("Error leyendo PDF:", pdfErr);
        context = "Error al leer el archivo PDF del Drive.";
      }
    }

    // 5. Configuración de Gemini
    const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Como experto Samsung HVAC, resuelve el error ${code} para ${deviceType}.
    Usa este fragmento de manual si es útil: ${context}
    Responde únicamente en formato JSON puro, sin bloques de código markdown:
    {
      "code": "${code}",
      "title": "Nombre del Error",
      "description": "Explicación",
      "possibleCauses": ["causa 1"],
      "steps": [{"instruction": "paso", "detail": "detalle"}],
      "severity": "high"
    }`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Limpieza de Markdown si Gemini lo incluye por error
    text = text.replace(/```json|```/g, "").trim();

    // Intentamos parsear la respuesta de la IA
    try {
      const jsonResponse = JSON.parse(text);
      return res.status(200).json(jsonResponse);
    } catch (parseErr) {
      console.error("Gemini no devolvió JSON puro:", text);
      return res.status(500).json({ error: "La IA devolvió un formato incorrecto." });
    }

  } catch (error) {
    console.error("Error técnico detallado:", error);
    return res.status(500).json({ 
      error: "Error de sincronización con el servidor.",
      message: error.message 
    });
  }
}