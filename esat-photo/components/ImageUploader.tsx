import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  previewUrl: string | null;
  onImageSelect: (file: File) => void;
  onClear: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ previewUrl, onImageSelect, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (previewUrl) {
    return (
      <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border-2 border-slate-700 group">
        <img 
          src={previewUrl} 
          alt="Original" 
          className="w-full h-full object-contain bg-slate-800/50 backdrop-blur-sm"
        />
        <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md">
          الصورة الأصلية
        </div>
        <button
          onClick={onClear}
          className="absolute top-2 left-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-transform hover:scale-110 shadow-lg"
          title="حذف الصورة"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={triggerUpload}
      className="w-full h-40 border-2 border-dashed border-slate-700 hover:border-primary-500/50 hover:bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group"
    >
      <div className="p-3 rounded-full bg-slate-800 group-hover:bg-primary-500/20 transition-colors mb-3">
        <Upload className="w-6 h-6 text-slate-400 group-hover:text-primary-400" />
      </div>
      <p className="text-slate-300 font-medium">ارفع صورة للتعديل عليها (اختياري)</p>
      <p className="text-slate-500 text-xs mt-1">PNG, JPG حتى 5MB</p>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};