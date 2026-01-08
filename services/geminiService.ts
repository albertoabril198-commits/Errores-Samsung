import { ErrorDiagnosis, DeviceType } from "../types";

export const diagnoseError = async (code: string, deviceType: DeviceType): Promise<ErrorDiagnosis> => {
  try {
    // IMPORTANTE: Ahora llamamos a nuestra propia API en Vercel
    const response = await fetch('/api/diagnose', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, deviceType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en la respuesta del servidor');
    }

    const result = await response.json();
    return result as ErrorDiagnosis;

  } catch (error: any) {
    console.error("Error en geminiService:", error);
    throw new Error(error.message || "No se pudo obtener el diagnóstico oficial.");
  }
};