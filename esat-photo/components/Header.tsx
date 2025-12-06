import React from 'react';
import { Camera, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full p-6 flex items-center justify-between border-b border-slate-700 bg-slate-800/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-primary-600 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-primary-500/20">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Esat Photo
          </h1>
          <p className="text-xs text-slate-400 font-medium">محرر الصور الذكي</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-full border border-primary-500/20">
        <Sparkles size={16} />
        <span className="text-sm font-medium">Nano Banana Model</span>
      </div>
    </header>
  );
};