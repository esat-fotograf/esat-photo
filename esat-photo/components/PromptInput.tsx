import React from 'react';
import { SendHorizontal } from 'lucide-react';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ value, onChange, onSubmit, isLoading }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-300 blur"></div>
      <div className="relative flex items-center bg-slate-800 rounded-2xl border border-slate-700 focus-within:border-primary-500/50 shadow-xl">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="صف الصورة التي تريد تعديلها أو إنشائها هنا... (مثال: أضف نظارات شمسية للقطة)"
          className="w-full bg-transparent text-white p-4 pr-6 rounded-2xl focus:outline-none resize-none min-h-[60px] max-h-[120px] placeholder-slate-500"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className={`absolute left-2 p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isLoading || !value.trim()
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-600/30 hover:scale-105'
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <SendHorizontal size={20} className="ml-0.5" /> // Adjusted for RTL visual centering
          )}
        </button>
      </div>
    </div>
  );
};