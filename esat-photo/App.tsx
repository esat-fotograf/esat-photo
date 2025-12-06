import React, { useState } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { fileToBase64, generateImageContent } from './services/geminiService';
import { AppStatus, ImageState } from './types';
import { Wand2 } from 'lucide-react';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [inputImage, setInputImage] = useState<ImageState>({
    file: null,
    previewUrl: null,
    base64: null,
  });
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setInputImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
      });
      // Clear previous results when new image is uploaded
      setResultImage(null);
      setStatus(AppStatus.IDLE);
    } catch (e) {
      console.error("File reading error", e);
      setError("فشل في قراءة ملف الصورة.");
    }
  };

  const handleClearImage = () => {
    setInputImage({
      file: null,
      previewUrl: null,
      base64: null,
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setStatus(AppStatus.LOADING);
    setError(null);
    setResultImage(null);

    try {
      const generatedBase64 = await generateImageContent(
        prompt,
        inputImage.base64,
        inputImage.file?.type
      );
      setResultImage(generatedBase64);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      setStatus(AppStatus.ERROR);
      setError(err.message || "حدث خطأ غير متوقع.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-primary-500/30">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8 pb-20">
        
        {/* Hero Section */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            حول خيالك إلى <span className="text-primary-400">واقع</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            استخدم نموذج Nano Banana لتوليد صور جديدة أو تعديل صورك الحالية بمجرد كتابة وصف بسيط.
          </p>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-6 sm:p-8 backdrop-blur-sm shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* Input Column */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  الصورة المرجعية (اختياري)
                </label>
                <ImageUploader 
                  previewUrl={inputImage.previewUrl} 
                  onImageSelect={handleImageSelect}
                  onClear={handleClearImage}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                  وصف التعديل / الإنشاء
                </label>
                <PromptInput 
                  value={prompt}
                  onChange={setPrompt}
                  onSubmit={handleGenerate}
                  isLoading={status === AppStatus.LOADING}
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={status === AppStatus.LOADING || !prompt.trim()}
                  className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-2
                    ${status === AppStatus.LOADING || !prompt.trim()
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white hover:shadow-primary-500/25 transform hover:-translate-y-1'
                    }`}
                >
                   {status === AppStatus.LOADING ? 'جاري المعالجة...' : 'ابدأ السحر'}
                   {!status === (AppStatus.LOADING as any) && <Wand2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Result Column (Desktop: Right side, Mobile: Stacked) */}
            <div className="flex flex-col h-full">
               <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  النتيجة
                </label>
                <div className="flex-grow bg-slate-900/50 rounded-2xl border border-slate-700/50 min-h-[300px] flex flex-col items-center justify-center p-4">
                  {status === AppStatus.IDLE && !resultImage ? (
                    <div className="text-center text-slate-600">
                      <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>النتيجة ستظهر هنا</p>
                    </div>
                  ) : (
                    <ResultDisplay status={status} imageUrl={resultImage} error={error} />
                  )}
                </div>
            </div>

          </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-slate-600 text-sm">
                Powered by Google Gemini (Nano Banana) API
            </p>
        </div>

      </main>
    </div>
  );
};

export default App;