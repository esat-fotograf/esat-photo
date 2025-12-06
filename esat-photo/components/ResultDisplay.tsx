import React from 'react';
import { Download, Share2, AlertCircle } from 'lucide-react';
import { AppStatus } from '../types';

interface ResultDisplayProps {
  status: AppStatus;
  imageUrl: string | null;
  error: string | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ status, imageUrl, error }) => {
  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `esat-photo-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (status === AppStatus.ERROR && error) {
    return (
      <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200 mt-6">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (status === AppStatus.LOADING) {
    return (
      <div className="w-full h-64 sm:h-96 rounded-2xl bg-slate-800 mt-6 flex flex-col items-center justify-center border border-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/30 to-transparent skew-x-12 animate-shimmer" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-slate-400 animate-pulse text-sm font-medium">جاري معالجة الصورة باستخدام الذكاء الاصطناعي...</p>
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="w-full mt-6 animate-fade-in">
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
          <img 
            src={imageUrl} 
            alt="Generated Result" 
            className="w-full h-auto max-h-[600px] object-contain mx-auto"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-between items-end backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300">
            <span className="text-white font-medium text-sm">النتيجة</span>
            <div className="flex gap-2">
              <button 
                onClick={handleDownload}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md transition-colors"
                title="تحميل"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};