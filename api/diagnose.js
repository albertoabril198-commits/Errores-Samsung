export const diagnoseError = async (code, deviceType) => {
  const response = await fetch('/api/diagnose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, deviceType }),
  });
  
  if (!response.ok) throw new Error('Fallo en el diagnóstico');
  return await response.json();
};
