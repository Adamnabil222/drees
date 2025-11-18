import React from 'react';
import type { Model, PredefinedModel } from '../types';
import ImageUploader from './ImageUploader';

interface ModelSelectorProps {
  models: PredefinedModel[];
  selectedModel: Model | null;
  onSelectModel: (model: PredefinedModel) => void;
  onUploadModel: (file: File) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onSelectModel, onUploadModel }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-indigo-400">الخطوة 1: اختر الموديل</h2>
      <p className="text-gray-400 mb-6">اختر من الموديلات الجاهزة أو ارفع صورة أو فيديو خاص بك.</p>
      
      <h3 className="text-lg font-semibold mb-3 text-gray-300">اختر من الجاهز:</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => onSelectModel(model)}
            className={`rounded-lg overflow-hidden border-4 transition-all duration-300 ${
              selectedModel?.id === model.id ? 'border-indigo-500 scale-105 shadow-lg' : 'border-transparent hover:border-indigo-400'
            }`}
          >
            <img src={model.src} alt={model.alt} className="w-full h-48 object-cover" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <ImageUploader 
            title="أو ارفع صورة موديل"
            description="اختر صورة واضحة لشخص."
            onFileChange={onUploadModel}
            file={selectedModel?.type === 'custom' && selectedModel.src.type.startsWith('image/') ? selectedModel.src : null}
            isCompact={true}
            accept="image/png, image/jpeg, image/webp"
        />
         <ImageUploader 
            title="أو ارفع فيديو موديل"
            description="سيتم استخدام الإطار الأول."
            onFileChange={onUploadModel}
            file={selectedModel?.type === 'custom' && selectedModel.src.type.startsWith('video/') ? selectedModel.src : null}
            isCompact={true}
            accept="video/mp4,video/webm"
        />
      </div>
    </div>
  );
};

export default ModelSelector;