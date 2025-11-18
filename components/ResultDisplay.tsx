import React, { useState } from 'react';
import { DownloadIcon, ShareIcon, RefreshIcon, MagicWandIcon, ErrorIcon } from './icons';
import ApiKeyErrorDisplay from './ApiKeyErrorDisplay';

interface ResultDisplayProps {
  image: string | null;
  onReset: () => void;
  onAnimate: (prompt: string) => void;
  isAnimating: boolean;
  generatedVideo: string | null;
  animationError: string | null;
  isApiKeySelected: boolean;
  onSelectApiKey: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
    image, 
    onReset, 
    onAnimate, 
    isAnimating, 
    generatedVideo, 
    animationError,
    isApiKeySelected,
    onSelectApiKey,
}) => {
    const [animationPrompt, setAnimationPrompt] = useState('');
    
    const handleShare = async () => {
        const urlToShare = generatedVideo || image;
        if (!urlToShare) {
            alert('لا يوجد ملف للمشاركة.');
            return;
        }

        const extension = generatedVideo ? 'mp4' : 'png';
        const mimeType = generatedVideo ? 'video/mp4' : 'image/png';
        const title = generatedVideo ? 'VirtualDresser Animation' : 'VirtualDresser Try-On';
        
        if(navigator.share) {
            try {
                const blob = await (await fetch(urlToShare)).blob();
                const file = new File([blob], `virtual-try-on.${extension}`, { type: mimeType });
                await navigator.share({
                    title: title,
                    text: 'Check out my new look created with VirtualDresser!',
                    files: [file],
                });
            } catch (error) {
                console.error('Error sharing:', error);
                alert('حدث خطأ أثناء محاولة المشاركة.');
            }
        } else {
            alert('المشاركة غير مدعومة في هذا المتصفح. يمكنك تحميل الملف ومشاركته يدوياً.');
        }
    };
    
    return (
        <div className="flex flex-col items-center animate-fade-in w-full">
            <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">النتيجة النهائية!</h2>
            
            <div className="w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl border-2 border-indigo-500/50 relative">
                 {generatedVideo ? (
                    <video src={generatedVideo} className="w-full h-auto object-contain" autoPlay loop muted controls />
                 ) : image ? (
                    <img src={image} alt="Generated try-on" className="w-full h-auto object-contain" />
                 ) : null}

                 {isAnimating && (
                    <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm z-10">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 border-4 border-gray-700 rounded-full opacity-50"></div>
                            <div className="absolute inset-2 border-4 border-indigo-500 rounded-full animate-ping"></div>
                        </div>
                        <h3 className="text-2xl font-bold mt-8 text-gray-300">جاري إنشاء الفيديو...</h3>
                        <p className="text-gray-400 mt-2">قد تستغرق هذه العملية عدة دقائق. لا تغلق الصفحة.</p>
                    </div>
                 )}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                    href={generatedVideo || image!}
                    download={`virtual-try-on.${generatedVideo ? 'mp4' : 'png'}`}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                    <DownloadIcon className="w-5 h-5" />
                    <span>تحميل {generatedVideo ? 'الفيديو' : 'الصورة'}</span>
                </a>
                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors"
                >
                    <ShareIcon className="w-5 h-5" />
                    <span>مشاركة</span>
                </button>
                 <button
                    onClick={onReset}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                    <RefreshIcon className="w-5 h-5" />
                    <span>البدء من جديد</span>
                </button>
            </div>
            
            {!generatedVideo && !isAnimating && image && (
                <div className="w-full max-w-2xl mt-10 border-t-2 border-dashed border-gray-700 pt-8 animate-fade-in">
                    <h3 className="text-2xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">✨ بث الحياة في الصورة</h3>
                    <p className="text-gray-400 mb-6 text-center max-w-lg mx-auto">
                        حوّل صورتك الثابتة إلى فيديو قصير وواقعي. فقط صف حركة بسيطة للموديل.
                    </p>
                    <textarea
                        value={animationPrompt}
                        onChange={(e) => setAnimationPrompt(e.target.value)}
                        placeholder="مثال: ابتسامة خفيفة، نظرة بطيئة إلى الكاميرا، حركة شعر بسيطة مع الرياح"
                        className="w-full h-20 p-4 bg-gray-900/50 rounded-lg border-2 border-gray-600 focus:border-purple-500 focus:ring-purple-500 transition-colors text-gray-200 placeholder-gray-500"
                        aria-label="وصف الحركة"
                    />
                    {!isApiKeySelected && !animationError && (
                        <p className="text-yellow-400 text-sm mt-2 text-center">
                            ملاحظة: لإنشاء فيديو، سيُطلب منك تحديد مفتاح Gemini API صالح مع تفعيل الفوترة.
                            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400 mx-1">
                                (معرفة المزيد)
                            </a>
                        </p>
                    )}
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={() => onAnimate(animationPrompt)}
                            disabled={!animationPrompt.trim()}
                            className="flex items-center gap-3 px-8 py-3 bg-purple-600 text-white rounded-lg font-bold shadow-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:scale-100"
                        >
                            <MagicWandIcon className="w-6 h-6" />
                            <span>إنشاء الفيديو</span>
                        </button>
                    </div>
                    {animationError === 'API_KEY_ERROR' ? (
                         <ApiKeyErrorDisplay onTryAgain={onSelectApiKey} isCompact={true} />
                    ) : animationError ? (
                        <div className="mt-6 w-full max-w-2xl flex flex-col items-center justify-center text-center p-4 bg-red-900/20 border border-red-500 rounded-lg">
                            <div className="flex items-center gap-2">
                                <ErrorIcon className="w-6 h-6 text-red-400" />
                                <h4 className="font-bold text-red-300">خطأ في إنشاء الفيديو</h4>
                            </div>
                            <p className="text-red-400 mt-2 text-sm">{animationError}</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default ResultDisplay;
