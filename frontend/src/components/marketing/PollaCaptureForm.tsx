'use client';

import React, { useState } from 'react';
import { Users, Trophy, Building2, ArrowRight } from 'lucide-react';

export const PollaCaptureForm: React.FC = () => {
  const [formData, setFormData] = useState({
    leaderName: '',
    groupName: '',
    friendsCount: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulario de Captura Enviado:", formData);
    setSubmitted(true);
    // Aquí iría la lógica de integración con Supabase o CRM
  };

  if (submitted) {
    return (
      <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-2xl shadow-blue-500/10 text-center flex flex-col items-center justify-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <Trophy className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">¡Bóveda Reservada!</h3>
        <p className="text-zinc-500 mb-8 leading-relaxed">
          Hemos recibido tu solicitud para <strong>{formData.groupName}</strong>. 
          Pronto te enviaremos el enlace para que invites a tus {formData.friendsCount || '0'} amigos.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-200 shadow-2xl shadow-blue-500/10 max-w-md mx-auto relative overflow-hidden group">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 bg-blue-50 w-fit px-3 py-1.5 rounded-full">
          <Trophy size={14} />
          <span>Polla de Oficina (Pari-Mutuel)</span>
        </div>
        
        <h2 className="text-4xl font-black text-zinc-900 mb-2 tracking-tighter leading-none">
          Arma tu <span className="text-blue-600">Torneo</span>
        </h2>
        <p className="text-zinc-500 mb-8">Sé el líder de tu grupo y gestiona la bóveda sin confiar en terceros.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del Líder */}
          <div>
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2 ml-1">Nombre del Líder</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Users className="h-5 w-5 text-zinc-400" />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                placeholder="Ej. Juan Pérez"
                value={formData.leaderName}
                onChange={(e) => setFormData({...formData, leaderName: e.target.value})}
              />
            </div>
          </div>

          {/* Nombre de la Empresa / Grupo */}
          <div>
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2 ml-1">Nombre de Empresa o Grupo</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-zinc-400" />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                placeholder="Ej. Oficina Central o Los Primos"
                value={formData.groupName}
                onChange={(e) => setFormData({...formData, groupName: e.target.value})}
              />
            </div>
          </div>

          {/* Número de Amigos */}
          <div>
            <label className="block text-xs font-black text-zinc-700 uppercase tracking-widest mb-2 ml-1">Número de Amigos</label>
            <div className="relative">
              <input 
                type="number" 
                min="2"
                max="100"
                required
                className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-zinc-900 placeholder:text-zinc-400"
                placeholder="Ej. 15"
                value={formData.friendsCount}
                onChange={(e) => setFormData({...formData, friendsCount: e.target.value})}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-zinc-400 font-medium">participantes</span>
              </div>
            </div>
          </div>

          {/* Botón Gigante */}
          <button 
            type="submit"
            className="w-full py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            Reclamar Bóveda de Prueba
            <ArrowRight className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};
