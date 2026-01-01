
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header con estilo técnico y moderno */}
      <header className="bg-[#1e293b] text-white shadow-xl sticky top-0 z-50 border-b border-blue-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Nuevo Icono Estilo Herramienta */}
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">
                HVAC <span className="text-blue-400 font-light not-italic">TechAssist</span>
              </h1>
              <p className="text-[10px] text-blue-200 uppercase tracking-[0.2em] font-bold">
                Professional Diagnostic Suite
              </p>
            </div>
          </div>
          
          {/* Badge de estado (Opcional) */}
          <div className="hidden sm:block">
            <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-3 py-1 rounded-full border border-green-500/20">
              SISTEMA ACTIVO
            </span>
          </div>
        </div>
      </header>
      
      {/* Contenido principal */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer Limpio */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2">HVAC TechAssist</p>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            &copy; {new Date().getFullYear()} Herramienta de Soporte Técnico Universal. 
            Desarrollada para asistencia en climatización profesional.
          </p>
          <div className="mt-4 flex justify-center space-x-4 text-[10px] font-bold text-blue-600 uppercase">
            <span>Seguridad Eléctrica</span>
            <span className="text-gray-300">|</span>
            <span>Manuales Técnicos</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;