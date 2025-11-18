import React from 'react';

interface LoaderProps {
    message?: string;
    subMessage?: string;
}

const Loader: React.FC<LoaderProps> = ({ 
    message = "جاري إنشاء المعاينة...", 
    subMessage = "يقوم الذكاء الاصطناعي بتجهيز صورتك. قد يستغرق هذا بضع لحظات." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-indigo-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 border-4 border-gray-700 rounded-full opacity-50"></div>
        <div className="absolute inset-2 border-4 border-purple-500 rounded-full animate-ping"></div>
      </div>
      <h3 className="text-2xl font-bold mt-8 text-gray-300">{message}</h3>
      <p className="text-gray-400 mt-2">{subMessage}</p>
    </div>
  );
};

export default Loader;