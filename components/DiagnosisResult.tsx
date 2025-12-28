
import React, { useState } from 'react';
import { ErrorDiagnosis, TroubleshootingStep } from '../types';

interface DiagnosisResultProps {
  diagnosis: ErrorDiagnosis;
}

const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ diagnosis }) => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl font-black text-[#034EA2]">{diagnosis.code}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getSeverityColor(diagnosis.severity)}`}>
                  Prioridad {diagnosis.severity}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{diagnosis.title}</h2>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg transition-colors border border-gray-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                Imprimir Guía
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Descripción del Problema</h3>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {diagnosis.description}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Causas Probables</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {diagnosis.possibleCauses.map((cause, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{cause}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 text-orange-800 font-bold mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  Advertencia de Seguridad
                </div>
                <p className="text-orange-900 text-sm leading-snug">
                  Desconecte siempre la fuente de alimentación antes de manipular componentes eléctricos. Utilice equipo de protección personal (EPP) adecuado. Si no está cualificado, contacte con el servicio técnico oficial.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h3 className="text-lg font-bold text-gray-900">Guía de Solución Paso a Paso</h3>
          <p className="text-sm text-gray-500">Siga estas instrucciones en orden para resolver la incidencia.</p>
        </div>
        <div className="divide-y divide-gray-100">
          {diagnosis.steps.map((step, index) => (
            <div 
              key={index} 
              className={`p-6 transition-colors cursor-pointer group ${completedSteps.includes(index) ? 'bg-green-50/50' : 'hover:bg-gray-50/50'}`}
              onClick={() => toggleStep(index)}
            >
              <div className="flex items-start gap-6">
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 transition-all
                  ${completedSteps.includes(index) 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-white border-blue-100 text-blue-600 group-hover:border-blue-400'}
                `}>
                  {completedSteps.includes(index) ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  ) : index + 1}
                </div>
                <div className="flex-grow">
                  <h4 className={`text-lg font-bold mb-1 transition-colors ${completedSteps.includes(index) ? 'text-green-800 line-through decoration-2' : 'text-gray-900'}`}>
                    {step.instruction}
                  </h4>
                  <p className={`text-gray-600 leading-relaxed ${completedSteps.includes(index) ? 'opacity-60' : ''}`}>
                    {step.detail}
                  </p>
                </div>
                <div className={`flex-shrink-0 self-center transition-opacity ${completedSteps.includes(index) ? 'opacity-100' : 'opacity-0'}`}>
                   <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Completado</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisResult;
