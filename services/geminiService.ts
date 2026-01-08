
import { ErrorDiagnosis, DeviceType } from "../types";

// Ya no necesitamos importar GoogleGenAI aquí porque la IA se ejecuta en el servidor (Vercel)
export const diagnoseError = async (code: string, deviceType: DeviceType): Promise<ErrorDiagnosis> => {
  try {
    // Llamamos a nuestra API de Vercel que configuramos para leer el Drive
    const response = await fetch('/api/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, deviceType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en la conexión con el servidor');
    }

    // La API nos devuelve el JSON ya procesado por Gemini usando tus manuales
    const result = await response.json();
    return result as ErrorDiagnosis;

  } catch (error: any) {
    console.error("Error diagnosing HVAC issue:", error);
    throw new Error(error.message || "No se pudo obtener el diagnóstico oficial. Verifique la conexión.");
  }
};