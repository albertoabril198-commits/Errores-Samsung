
import { GoogleGenAI } from "@google/generative-ai"; // Nombre actualizado
import { ErrorDiagnosis, DeviceType } from "../types";

export const diagnoseError = async (code: string, deviceType: DeviceType): Promise<ErrorDiagnosis> => {
  try {
    // IMPORTANTE: Ahora llamamos a nuestra propia API en Vercel
    // Esta API es la que tiene acceso a Google Drive y a los manuales
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