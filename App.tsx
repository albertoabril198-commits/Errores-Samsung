
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DiagnosisResult from './components/DiagnosisResult';
import { diagnoseError } from './services/geminiService';
import { ErrorDiagnosis, DeviceType, SearchHistory } from './types';

const App: React.FC = () => {
  const [errorCode, setErrorCode] = useState('');
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
      const result = await diagnoseError(errorCode, deviceType);
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
    setDiagnosis(null);
    setError(null);
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar / Controls */}
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
                  {errorCode && (
                    <button 
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                    </button>
                  )}
                </div>
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
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analizando...
                  </span>
                ) : 'Diagnosticar Error'}
              </button>
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
                      // Trigger manually
                      diagnoseError(item.code, item.deviceType).then(setDiagnosis).catch(setError);
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

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!diagnosis && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <div className="w-24 h-24 bg-blue-50 text-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo podemos ayudarte hoy?</h3>
              <p className="text-gray-500 max-w-md">
                Ingresa el código que aparece en el display del equipo para obtener un diagnóstico asistido por IA y una guía de solución técnica.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {['E101', 'E201', 'E464'].map(code => (
                   <button 
                    key={code}
                    onClick={() => setErrorCode(code)}
                    className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-sm font-semibold text-gray-600 border border-gray-200 transition-colors"
                   >
                     Probar {code}
                   </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-2xl w-full"></div>
              <div className="h-64 bg-gray-200 rounded-2xl w-full"></div>
            </div>
          )}

          {diagnosis && <DiagnosisResult diagnosis={diagnosis} />}
        </div>
      </div>
    </Layout>
  );
};

export default App;
