export const extractFrameFromVideo = (videoFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            return reject(new Error('لا يمكن الحصول على سياق Canvas.'));
        }

        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const frameFile = new File([blob], 'first_frame.jpg', { type: 'image/jpeg' });
                    resolve(frameFile);
                } else {
                    reject(new Error('فشل في تحويل الـ canvas إلى blob.'));
                }
                URL.revokeObjectURL(video.src); // Clean up
            }, 'image/jpeg', 0.95);
        });

        video.addEventListener('error', (e) => {
            reject(new Error(`خطأ في تحميل الفيديو: ${e.message}`));
            URL.revokeObjectURL(video.src);
        });
        
        video.src = URL.createObjectURL(videoFile);
        video.currentTime = 0; // Seek to the beginning
    });
};
