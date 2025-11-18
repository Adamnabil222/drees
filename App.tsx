import React, { useState, useCallback, useEffect } from 'react';
import { generateTryOnImage, generateAnimation, generateVideoFromReferences } from './services/geminiService';
import { PREDEFINED_MODELS } from './constants';
import type { Model } from './types';
import Header from './components/Header';
import ModelSelector from './components/ModelSelector';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import Loader from './components/Loader';
import ApiKeyErrorDisplay from './components/ApiKeyErrorDisplay';
import { ErrorIcon, MagicWandIcon } from './components/icons';
import { extractFrameFromVideo } from './utils';

const App: React.FC = () => {
  const [model, setModel] = useState<Model | null>(null);
  const [clothing, setClothing] = useState<File | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [videoPrompt, setVideoPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [animationError, setAnimationError] = useState<string | null>(null);
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setIsApiKeySelected(true);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setIsApiKeySelected(true);
        setError(null);
        setAnimationError(null); 
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!model || !clothing) {
      setError('الرجاء اختيار موديل ورفع صورة قطعة الملابس.');
      return;
    }

    const wantsVideo = !!videoPrompt.trim();
    if (wantsVideo && !isApiKeySelected) {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setIsApiKeySelected(true);
      } else {
        setError("ميزة الفيديو غير متاحة في هذه البيئة.");
        return;
      }
    }

    const isDirectVideoFlow = model.type === 'custom' && model.src.type.startsWith('video/') && wantsVideo;

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);
    setAnimationError(null);
    
    if (isDirectVideoFlow) {
      try {
        const videoUrl = await generateVideoFromReferences(model.src, clothing, videoPrompt);
        setGeneratedVideo(videoUrl);
      } catch (err) {
        console.error("Direct video generation failed:", err);
        if (err instanceof Error) {
            if (err.message.includes('API_KEY_ERROR')) {
                setIsApiKeySelected(false);
                setError('API_KEY_ERROR');
            } else if (err.message.toLowerCase().includes('failed to fetch')) {
                setError("فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
            } else {
                setError(err.message);
            }
        } else {
            setError("حدث خطأ غير متوقع أثناء إنشاء الفيديو.");
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    let generatedImageForVideo: string | null = null;
    try {
      let modelFile: File;
      if (model.type === 'predefined') {
        const response = await fetch(model.src);
        if (!response.ok) throw new Error(`فشل في جلب صورة الموديل: ${response.statusText}`);
        const modelBlob = await response.blob();
        modelFile = new File([modelBlob], "model.jpg", { type: modelBlob.type });
      } else { 
        if (model.src.type.startsWith('video/')) {
            modelFile = await extractFrameFromVideo(model.src);
        } else {
            modelFile = model.src;
        }
      }

      const imageResult = await generateTryOnImage(modelFile, clothing, customPrompt);
      generatedImageForVideo = imageResult;
      setGeneratedImage(imageResult);

      if (wantsVideo) {
        const videoUrl = await generateAnimation(imageResult, videoPrompt);
        setGeneratedVideo(videoUrl);
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        if (wantsVideo && generatedImageForVideo) {
            if (err.message.includes('API_KEY_ERROR')) {
                setIsApiKeySelected(false);
                setAnimationError('API_KEY_ERROR');
            } else {
                setAnimationError(err.message);
            }
        } else { 
            if (err.message.toLowerCase().includes('failed to fetch')) {
                setError("فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.");
            } else {
                setError(err.message);
            }
        }
      } else {
        if (wantsVideo && generatedImageForVideo) {
            setAnimationError("حدث خطأ غير متوقع أثناء إنشاء الفيديو.");
        } else {
            setError("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [model, clothing, customPrompt, videoPrompt, isApiKeySelected]);
  
  const handleAnimate = useCallback(async (animationPrompt: string) => {
    if (!generatedImage) {
      setAnimationError("لا توجد صورة لتحريكها.");
      return;
    }

    if (!isApiKeySelected) {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setIsApiKeySelected(true);
        } else {
            setAnimationError("ميزة الفيديو غير متاحة في هذه البيئة.");
            return;
        }
    }

    setIsAnimating(true);
    setAnimationError(null);
    setGeneratedVideo(null);
    
    try {
      const videoUrl = await generateAnimation(generatedImage, animationPrompt);
      setGeneratedVideo(videoUrl);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        if (err.message.includes('API_KEY_ERROR')) {
            setIsApiKeySelected(false); 
            setAnimationError('API_KEY_ERROR');
        } else {
            setAnimationError(err.message);
        }
      } else {
        setAnimationError("حدث خطأ غير متوقع أثناء إنشاء الفيديو.");
      }
    } finally {
      setIsAnimating(false);
    }
  }, [generatedImage, isApiKeySelected]);

  const resetState = () => {
    setModel(null);
    setClothing(null);
    setCustomPrompt('');
    setVideoPrompt('');
    setGeneratedImage(null);
    setIsLoading(false);
    setError(null);
    setGeneratedVideo(null);
    setIsAnimating(false);
    setAnimationError(null);
  };
  
  const isGeneratingVideo = !!videoPrompt.trim();
  const isDirectVideoFlowAtRender = model?.type === 'custom' && model.src.type.startsWith('video/') && isGeneratingVideo;


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-7xl flex-grow container mx-auto bg-gray-800/50 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700">
        {!generatedImage && !isLoading && !error && !generatedVideo && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ModelSelector
                models={PREDEFINED_MODELS}
                selectedModel={model}
                onSelectModel={setModel}
                onUploadModel={(file) => setModel({ id: 'custom', type: 'custom', src: file })}
              />
              <ImageUploader
                title="الخطوة 2: ارفع قطعة الملابس"
                description="اختر صورة واضحة لقطعة الملابس على خلفية بسيطة للحصول على أفضل النتائج."
                file={clothing}
                onFileChange={setClothing}
                accept="image/png, image/jpeg, image/webp"
              />
            </div>
            
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4 text-indigo-400">الخطوة 3: أضف تفاصيل للصورة (اختياري)</h2>
                <p className="text-gray-400 mb-4">
                    صف كيف تريد أن تبدو الصورة النهائية. مثلاً: "اجعل الموديل يقف في حديقة"، "غير إضاءة الصورة لتكون عند غروب الشمس".
                    {model?.type === 'custom' && model.src.type.startsWith('video/') && <span className="block text-yellow-400 text-sm mt-2">ملاحظة: سيتم تجاهل هذا الحقل عند إنشاء فيديو مباشرة من فيديو موديل.</span>}
                </p>
                <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="أدخل تفاصيل إضافية للصورة هنا..."
                    className="w-full h-24 p-4 bg-gray-900/50 rounded-lg border-2 border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 transition-colors text-gray-200 placeholder-gray-500"
                    aria-label="تفاصيل إضافية للصورة"
                    disabled={model?.type === 'custom' && model.src.type.startsWith('video/')}
                />
            </div>
            
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">الخطوة 4: حوّلها إلى فيديو (اختياري)</h2>
                <p className="text-gray-400 mb-4">
                    حوّل صورتك الثابتة إلى فيديو قصير وواقعي. فقط صف حركة بسيطة للموديل ليقوم بها.
                    {model?.type === 'custom' && model.src.type.startsWith('video/') && <span className="block text-green-400 text-sm mt-2">أنت في الوضع المتقدم! سيتم استخدام الفيديو الذي رفعته كمرجع لإنشاء فيديو جديد بالكامل.</span>}
                </p>
                <textarea
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="مثال: ابتسامة خفيفة، نظرة بطيئة إلى الكاميرا، حركة شعر بسيطة مع الرياح"
                    className="w-full h-24 p-4 bg-gray-900/50 rounded-lg border-2 border-gray-600 focus:border-purple-500 focus:ring-purple-500 transition-colors text-gray-200 placeholder-gray-500"
                    aria-label="وصف حركة الفيديو"
                />
                {!isApiKeySelected && (
                    <p className="text-yellow-400 text-sm mt-2">
                        ملاحظة: لإنشاء فيديو، ستحتاج إلى تحديد مفتاح Gemini API صالح مع تفعيل الفوترة. سيتم طلب ذلك عند الضغط على زر الإنشاء.
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400 mx-1">
                            (معرفة المزيد)
                        </a>
                    </p>
                )}
            </div>
          </>
        )}

        {error === 'API_KEY_ERROR' && (
            <ApiKeyErrorDisplay onTryAgain={() => { setError(null); handleSelectApiKey(); }} />
        )}

        {error && error !== 'API_KEY_ERROR' && (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
            <ErrorIcon className="w-16 h-16 text-red-400 mb-4" />
            <h3 className="text-xl font-bold text-red-300">حدث خطأ</h3>
            <p className="text-red-400 mt-2 max-w-lg">{error}</p>
            <button
              onClick={resetState}
              className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              حاول مجدداً
            </button>
          </div>
        )}

        {isLoading && <Loader 
            message={isDirectVideoFlowAtRender ? "جاري إنشاء الفيديو مباشرة..." : isGeneratingVideo ? "جاري إنشاء الفيديو..." : "جاري إنشاء المعاينة..."}
            subMessage={isDirectVideoFlowAtRender ? "يستخدم النموذج المتقدم الفيديو كمرجع. قد تستغرق هذه العملية عدة دقائق." : isGeneratingVideo ? "هذه عملية من خطوتين وقد تستغرق عدة دقائق." : "يقوم الذكاء الاصطناعي بتجهيز صورتك. قد يستغرق هذا بضع لحظات."}
        />}

        {(generatedImage || generatedVideo) && (
          <ResultDisplay 
            image={generatedImage}
            onReset={resetState}
            onAnimate={handleAnimate}
            isAnimating={isAnimating}
            generatedVideo={generatedVideo}
            animationError={animationError}
            isApiKeySelected={isApiKeySelected}
            onSelectApiKey={handleSelectApiKey}
          />
        )}
        
        {!isLoading && !generatedImage && !generatedVideo && !error && (
             <div className="mt-8 flex justify-center">
             <button
               onClick={handleGenerate}
               disabled={!model || !clothing}
               className="flex items-center gap-3 px-12 py-4 text-xl font-bold bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100"
             >
               {isGeneratingVideo && <MagicWandIcon className="w-6 h-6" />}
               <span>{isGeneratingVideo ? 'إنشاء الفيديو' : 'إنشاء الصورة'}</span>
             </button>
           </div>
        )}
      </main>
      <footer className="w-full text-center p-4 mt-8 text-gray-500 text-sm">
        <p>تم التطوير بواسطة مهندس React خبير بواجهة Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
