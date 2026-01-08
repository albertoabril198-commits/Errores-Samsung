import { GoogleGenAI } from "@google/generative-ai";
import { GoogleGenAI } from "@google/genai";
import pdf from 'pdf-parse';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Buscamos archivos pero limitamos la búsqueda para ganar velocidad
    const folderId = process.env.DRIVE_FOLDER_ID;
    const driveRes = await drive.files.list({
      q: `'${folderId}' in parents and mimeType = 'application/pdf'`,
      fields: 'files(id, name)',
      pageSize: 2 // Solo miramos los 2 archivos más recientes/importantes para evitar el timeout
    });

    let context = "";
    
    // 2. Intentamos leer solo el primer archivo para asegurar que entramos en tiempo
    if (driveRes.data.files.length > 0) {
      const file = driveRes.data.files[0];
      const response = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'arraybuffer' }
      );
      const pdfData = await pdf(Buffer.from(response.data));
      // Solo tomamos una parte del texto donde podría estar el error
      context = pdfData.text.substring(0, 15000); 
    }

    const genAI = new GoogleGenAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Flash es mucho más rápido que Pro

    const prompt = `Como experto Samsung HVAC, resuelve el error ${code} para ${deviceType}.
    Usa este fragmento de manual si es útil: ${context}
    Responde únicamente en formato JSON puro, sin markdown:
    {
      "code": "${code}",
      "title": "Nombre",
      "description": "Info",
      "possibleCauses": ["causa"],
      "steps": [{"instruction": "paso", "detail": "detalle"}],
      "severity": "medium"
    }`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Limpieza de seguridad para asegurar que es un JSON válido
    if (text.startsWith("```")) {
      text = text.replace(/```json|```/g, "");
    }

    res.status(200).json(JSON.parse(text));

  } catch (error) {
    console.error("Error técnico:", error);
    res.status(500).json({ error: "Error de sincronización. Inténtalo de nuevo." });
  }
}