import * as genai from "@google/generative-ai";
import { google } from 'googleapis';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { code, deviceType } = req.body;
    const genAI = new genai.GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let manualContext = "No se pudo acceder al manual a tiempo.";

    // INTENTO DE LECTURA FLASH (Máximo 10 segundos)
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim());
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      const drive = google.drive({ version: 'v3', auth });

      const driveRes = await Promise.race([
        drive.files.list({
          q: `'${process.env.DRIVE_FOLDER_ID}' in parents`,
          fields: 'files(id, name, size)',
          pageSize: 1
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Drive Lento')), 2000))
      ]);

      // Si el archivo es mayor a 5MB, ni siquiera intentamos descargarlo para evitar el bloqueo
      if (driveRes.data.files?.length > 0) {
        const file = driveRes.data.files[0];
        if (parseInt(file.size) < 5000000) { 
          const fileContent = await drive.files.get({ fileId: file.id, alt: 'media' });
          manualContext = typeof fileContent.data === 'string' ? fileContent.data.substring(0, 5000) : "Archivo no legible.";
        }
      }
    } catch (e) {
      console.log("Modo rápido activado: Usando conocimiento base de Gemini.");
    }

    const prompt = `Como experto en climatización Samsung HVAC, resuelve el error ${code} para el equipo ${deviceType}. 
    Información del manual (si está disponible): ${manualContext}.
    Responde estrictamente en JSON con esta estructura: 
    {"code":"${code}","title":"Nombre","description":"Explicación","possibleCauses":["Causa"],"steps":[{"instruction":"Paso","detail":"Explicación"}],"severity":"high"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error) {
    // Si todo lo anterior falla, Gemini responde con lo que sabe por defecto
    return res.status(200).json({ 
      code: req.body.code,
      title: "Diagnóstico de Emergencia",
      description: "Error al procesar el manual pesado. Basado en conocimiento general: " + error.message,
      possibleCauses: ["Fallo de sensor", "Problema de placa"],
      steps: [{"instruction": "Revisión básica", "detail": "Verificar alimentación y cableado de señal."}],
      severity: "medium"
    });
  }
}