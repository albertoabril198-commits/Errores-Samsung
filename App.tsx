import React, { useState } from 'react';
import Layout from './components/Layout';
import DiagnosisResult from './components/DiagnosisResult';
import { diagnoseError } from './services/aiService';
import { ErrorDiagnosis, DeviceType } from './types';

const App: React.FC = () => {
  const [errorCode, setErrorCode] = useState('');
  const [extraInfo, setExtraInfo] = useState(''); 
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.RAC);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<ErrorDiagnosis | null>(null);
  const [error, setError] = useState<{message: string, isQuota: boolean} | null>(null);

  const handleDiagnose = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!errorCode.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await diagnoseError(errorCode, deviceType, extraInfo);
      setDiagnosis(result);
    } catch (err: any) {
      console.error("Error en el componente:", err);
      
      // Detectamos si el error es por límite de cuota de Google
      const isQuotaError = err.message.includes("429") || 
                           err.message.toLowerCase().includes("quota") || 
                           err.message.toLowerCase().includes("rate limit");

      setError({
        message: isQuotaError 
          ? 'Has alcanzado el límite de consultas gratuitas por minuto. Por favor, espera 60 segundos e inténtalo de nuevo.' 
          : (err.message || 'Error de conexión con el servicio de IA.'),
        isQuota: isQuotaError
      });
      setDiagnosis(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setErrorCode('');
    setExtraInfo(''); 
    setDiagnosis(null);
    setError(null);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Columna de Formulario */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              Nueva Búsqueda
            </h2>
            
            <form onSubmit={handleDiagnose} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Código de Error</label>
                <input 
                  type="text" 
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value.toUpperCase())}
                  placeholder="Ej: E101, E201..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Más información</label>
                <textarea 
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  placeholder="Síntomas detectados..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gama</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(DeviceType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDeviceType(type)}
                      className={`text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                        ${deviceType === type 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                          : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !errorCode}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95
                    ${loading || !errorCode ? 'bg-gray-300' : 'bg-[#1e293b] hover:bg-slate-800 shadow-lg'}`}
                >
                  {loading ? 'Analizando...' : 'Diagnosticar'}
                </button>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="w-full py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  Limpiar Pantalla
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Columna de Resultados */}
        <div className="lg:col-span-3">
          {error && (
            <div className={`${error.isQuota ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-red-50 border-red-500 text-red-700'} border-l-4 p-4 rounded-xl mb-6 text-sm`}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-bold">{error.isQuota ? 'Límite de Consultas Alcanzado' : 'Aviso del Sistema'}</p>
              </div>
              <p className="mt-1 ml-7">{error.message}</p>
            </div>
          )}

          {!diagnosis && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sistema de Diagnóstico Listo</h3>
              <p className="text-gray-400 max-w-sm">
                Introduce el código de error para obtener la guía de reparación paso a paso.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-pulse">
              <div className="h-8 bg-gray-200 rounded-lg w-1/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                <div className="h-4 bg-gray-100 rounded w-4/6"></div>
              </div>
            </div>
          )}

          {diagnosis && <DiagnosisResult diagnosis={diagnosis} />}
        </div>
      </div>
    </Layout>
  );
};

export default App;