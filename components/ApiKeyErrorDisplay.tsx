import React from 'react';
import { ErrorIcon } from './icons';

interface ApiKeyErrorDisplayProps {
  onTryAgain: () => void;
  isCompact?: boolean;
}

const ApiKeyErrorDisplay: React.FC<ApiKeyErrorDisplayProps> = ({ onTryAgain, isCompact = false }) => {
  if (isCompact) {
    return (
      <div className="mt-6 w-full max-w-2xl flex flex-col items-center justify-center text-center p-4 bg-red-900/20 border border-red-500 rounded-lg">
        <div className="flex items-center gap-2">
            <ErrorIcon className="w-6 h-6 text-red-400" />
            <h4 className="font-bold text-red-300">خطأ في مفتاح API</h4>
        </div>
        <p className="text-red-400 mt-2 text-sm">
            لا يمكن إنشاء الفيديو بدون مفتاح صالح. يرجى التأكد من أن مفتاحك لديه صلاحية استخدام خدمة الفيديو والفوترة مفعلة.
             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400 mx-1">
                (إنشاء مفتاح جديد)
            </a>
        </p>
        <button
            onClick={onTryAgain}
            className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-bold text-white shadow-md"
        >
            محاولة بمفتاح آخر
        </button>
      </div>
    );
  }
    
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-red-900/20 border border-red-500 rounded-lg">
      <ErrorIcon className="w-16 h-16 text-red-400 mb-4" />
      <h3 className="text-xl font-bold text-red-300">خطأ في إنشاء الفيديو: مطلوب مفتاح API صالح</h3>
      <div className="text-red-300 mt-4 max-w-xl text-right space-y-2">
          <p>
              أتفهم أن هذا قد يكون محبطًا. للأسف، لا يمكن إنشاء الفيديو تلقائيًا بدون إعداد صحيح من طرفك، فهذه هي الطريقة التي تعمل بها خدمة Gemini المتقدمة للفيديو.
          </p>
          <p className="font-bold pt-2">لماذا هذا ضروري؟</p>
          <p>
              المفتاح يربط طلبك بمشروعك على Google Cloud ويسمح باستخدام نماذج الفيديو القوية، والتي تتطلب تفعيل الفوترة لتعمل.
          </p>
          <p className="font-bold pt-2">ماذا تفعل الآن:</p>
          <ol className="list-decimal list-inside space-y-1">
              <li>
                  اذهب إلى <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">صفحة إعدادات Google AI Studio</a> لإنشاء مفتاح API جديد.
              </li>
              <li>
                  تأكد من أن المفتاح مرتبط بمشروع Google Cloud تم تفعيل <strong>الفوترة</strong> وخدمة <strong>"Generative AI API"</strong> فيه.
              </li>
              <li>
                  بعد إنشاء/إعداد المفتاح، اضغط على الزر أدناه لاختياره من القائمة.
              </li>
          </ol>
      </div>
      <button
        onClick={onTryAgain}
        className="mt-6 px-8 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-bold text-white text-lg shadow-md"
      >
        اختيار مفتاح والمحاولة مجدداً
      </button>
    </div>
  );
};

export default ApiKeyErrorDisplay;
