
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DiagnosisResult from './components/DiagnosisResult';
import { diagnoseError } from './services/geminiService';
import { ErrorDiagnosis, DeviceType, SearchHistory } from './types';

const App: React.FC = () => {
  const [errorCode, setErrorCode] = useState('');
  // --- NUEVO ESTADO PARA INFORMACIÓN EXTRA ---
  const [extraInfo, setExtraInfo] = useState(''); 
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.RAC);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<ErrorDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistory[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('hvac_search_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (code: string, type: DeviceType) => {
    const newItem: SearchHistory = { code, deviceType: type, timestamp: Date.now() };
    const updatedHistory = [newItem, ...history.filter(h => h.code !== code)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('hvac_search_history', JSON.stringify(updatedHistory));
  };

  const handleDiagnose = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!errorCode.trim()) return;

    setLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      // --- AHORA PASAMOS TAMBIÉN LA INFO EXTRA AL SERVICIO ---
      // Nota: Asegúrate de que tu geminiService acepte este tercer parámetro opcional
      const result = await diagnoseError(errorCode, deviceType, extraInfo);
      setDiagnosis(result);
      saveToHistory(errorCode, deviceType);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setErrorCode('');
    setExtraInfo(''); // Limpia también la info extra
    setDiagnosis(null);
    setError(null);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              Nueva Búsqueda
            </h2>
            
            <form onSubmit={handleDiagnose} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Código de Error</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={errorCode}
                    onChange={(e) => setErrorCode(e.target.value.toUpperCase())}
                    placeholder="Ej: E101, E201..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* --- NUEVO CUADRO DE MÁS INFORMACIÓN --- */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Más información / Síntomas</label>
                <textarea 
                  value={extraInfo}
                  onChange={(e) => setExtraInfo(e.target.value)}
                  placeholder="Ej: El ventilador no gira, parpadea luz roja..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[100px] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gama de Producto</label>
                <div className="grid grid-cols-1 gap-2">
                  {Object.values(DeviceType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDeviceType(type)}
                      className={`
                        text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all border
                        ${deviceType === type 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                          : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'}
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading || !errorCode}
                  className={`
                    w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95
                    ${loading || !errorCode 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-[#034EA2] hover:bg-blue-800 shadow-lg shadow-blue-200'}
                  `}
                >
                  {loading ? 'Analizando...' : 'Diagnosticar Error'}
                </button>

                {/* --- NUEVO BOTÓN PARA BORRAR TODO --- */}
                <button
                  type="button"
                  onClick={clearSearch}
                  className="w-full py-3 rounded-xl font-semibold text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  Borrar Todo
                </button>
              </div>
            </form>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Consultas Recientes</h2>
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setErrorCode(item.code);
                      setDeviceType(item.deviceType);
                      diagnoseError(item.code, item.deviceType, '').then(setDiagnosis).catch(setError);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-blue-50 hover:border-blue-100 transition-all text-left group"
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900 group-hover:text-blue-700">{item.code}</div>
                      <div className="text-[10px] text-gray-400">{item.deviceType}</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!diagnosis && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo podemos ayudarte hoy?</h3>
              <p className="text-gray-500 max-w-md">
                Ingresa el código y cuéntanos qué síntomas tiene el equipo para un diagnóstico más preciso.
              </p>
            </div>
          )}

          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-2xl w-full"></div>
            </div>
          )}

          {diagnosis && <DiagnosisResult diagnosis={diagnosis} />}
        </div>
      </div>
    </Layout>
  );
};

export default App;
