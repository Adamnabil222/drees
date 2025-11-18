
import React, { useRef } from 'react';
import { UploadIcon, TrashIcon } from './icons';

interface ImageUploaderProps {
  title: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  isCompact?: boolean;
  accept?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ title, description, file, onFileChange, isCompact = false, accept }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };
  
  const containerClass = isCompact 
    ? "bg-gray-800/50 p-4 rounded-lg border border-dashed border-gray-600 hover:border-indigo-500 transition-colors"
    : "bg-gray-800 p-6 rounded-lg border border-gray-700";

  return (
    <div className={containerClass}>
      {!isCompact && (
          <>
            <h2 className="text-2xl font-bold mb-4 text-indigo-400">{title}</h2>
            <p className="text-gray-400 mb-6">{description}</p>
          </>
      )}
      <div
        className="w-full h-64 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors"
        onClick={openFileDialog}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept={accept || "image/png, image/jpeg, image/webp"}
        />
        {file ? (
          <div className="relative w-full h-full p-2">
            {file.type.startsWith('video/') ? (
                <video
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-contain rounded"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            ) : (
                <img
                    src={URL.createObjectURL(file)}
                    alt="معاينة"
                    className="w-full h-full object-contain rounded"
                />
            )}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onFileChange(null);
                    if(fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 p-2 bg-red-600/80 hover:bg-red-700 rounded-full text-white transition-all"
                aria-label="إزالة الصورة"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <UploadIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="font-semibold">{isCompact ? title : 'انقر لاختيار ملف'}</p>
            <p className="text-sm">{isCompact ? description : 'أو اسحبه وأفلته هنا'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;