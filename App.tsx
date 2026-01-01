import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DiagnosisResult from './components/DiagnosisResult';
import { diagnoseError } from './services/geminiService';
import { ErrorDiagnosis, DeviceType, SearchHistory } from './types';

const App: React.FC = () => {
  const [errorCode, setErrorCode] = useState('');
  const [extraInfo, setExtraInfo] = useState(''); 
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.RAC);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<ErrorDiagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistory[]>([]);

  // Cargar historial al iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('hvac_search_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Guardar en historial
  const saveToHistory = (code: string, type: DeviceType) => {
    const newItem: SearchHistory = { code, deviceType: type, timestamp: Date.now() };
    const updatedHistory = [newItem, ...history.filter(h => h.code !== code)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('hvac_search_history', JSON.stringify(updatedHistory));
  };

  // Función principal de diagnóstico
  const handleDiagnose = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!errorCode.trim()) return;

    setLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      const result = await diagnoseError(errorCode, deviceType, extraInfo);
      setDiagnosis(result);
      saveToHistory(errorCode, deviceType);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // LIMPIEZA TOTAL: Borra campos, diagnóstico e historial
  const clearSearch = () => {
    setErrorCode('');
    setExtraInfo(''); 
    setDiagnosis(null);
    setError(null);
    setHistory([]); // Limpia la lista visual
    localStorage.removeItem('hvac_search_history'); // Borra la memoria física
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
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
                      : 'bg-[#1e293b] hover:bg-slate-800 shadow-lg shadow-blue-200'}
                  `}
                >
                  {loading ? 'Analizando...' : 'Diagnosticar Error'}
                </button>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="w-full py-3 rounded-xl font-semibold text-red-500 hover:bg-red-50 transition-colors border border-red-100"
                >
                  Borrar Todo
                </button>
              </div>
            </form>
          </div>

          {/* Historial */}
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
                      setExtraInfo(''); // Limpiar info extra al cargar del historial
                      // Ejecutar búsqueda automáticamente
                      diagnoseError(item.code, item.deviceType, '').then(setDiagnosis).catch
