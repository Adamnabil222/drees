import { GoogleGenAI, Modality, VideoGenerationReferenceImage, VideoGenerationReferenceType } from "@google/genai";
import { extractFrameFromVideo } from "../utils";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error("فشل في قراءة الملف كـ data URL."));
        }
    };
    reader.onerror = (error) => {
        reject(new Error(`خطأ في قراءة الملف: ${error}`));
    };
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateTryOnImage = async (modelImageFile: File, clothingImageFile: File, customPrompt: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key is not configured");
    }
    const ai = new GoogleGenAI({ apiKey });

    const modelImagePart = await fileToGenerativePart(modelImageFile);
    const clothingImagePart = await fileToGenerativePart(clothingImageFile);

    const basePrompt = `
# الهوية: أنت خبير أزياء رقمي متخصص
وظيفتك **الوحيدة** هي تنفيذ عملية استبدال ملابس نظيفة ومثالية بنسبة 100%.

# المدخلات
1.  \`[صورة الموديل]\`: الشخص الذي سيرتدي الملابس الجديدة.
2.  \`[صورة قطعة الملابس]\`: الملابس الجديدة المراد إلباسها.

# المهمة الأساسية (الهدف الأوحد)
مهمتك هي إنتاج صورة جديدة حيث يرتدي الشخص من \`[صورة الموديل]\` قطعة الملابس من \`[صورة قطعة الملابس]\` **فقط**. يجب أن تختفي الملابس الأصلية الموجودة في \`[صورة الموديل]\` بالكامل وبشكل مطلق.

# قاعدة عدم التسامح المطلق (الأهم)
**حالة الفشل**: أي عنصر مرئي من الملابس الأصلية في الصورة النهائية يعتبر فشلاً كاملاً للمهمة.
هذا يشمل على سبيل المثال لا الحصر:
-   **أي كتابة أو نص.**
-   أي شعارات (لوجوهات) أو رسومات.
-   ياقات أو أكمام أو حواف من الملابس الأصلية.
-   نقشات أو ألوان أو ملمس القماش الأصلي.

**إذا ظهر أي شيء من هذه القائمة، فالنتيجة مرفوضة.**

# أسلوب التنفيذ: استبدال وليس تعديل
-   تعامل مع \`[صورة قطعة الملابس]\` كـ **طبقة صلبة وغير شفافة (opaque layer)**.
-   مهمتك هي **استبدال** الملابس القديمة بالجديدة.
-   **لا تدمج، لا تمزج، لا تخلط.**
-   **استبدل. لا تعدل.**

# المراجعة النهائية (إلزامي قبل الإخراج)
قبل إخراج النتيجة، اسأل نفسك: هل يمكن رؤية أي أثر، ولو بكسل واحد، من الملابس الأصلية؟ إذا كانت الإجابة "نعم"، ابدأ من جديد حتى يتم تحقيق الإزالة الكاملة.
    `;

    const finalPrompt = customPrompt
      ? `${basePrompt}\n\n**توجيهات إضافية من المستخدم يجب تنفيذها بدقة**: ${customPrompt}`
      : basePrompt;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            modelImagePart,
            clothingImagePart,
            { text: finalPrompt },
          ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    if (!response.candidates || response.candidates.length === 0) {
        const blockReason = response.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`لم نتمكن من معالجة طلبك لأن الصور المقدمة قد تنتهك سياسات الأمان (${blockReason}). يرجى محاولة استخدام صور مختلفة.`);
        }
        throw new Error("لم يتمكن النموذج من إنشاء صورة. حاول مرة أخرى بصور مختلفة أو عدّل الوصف الإضافي.");
    }
    
    const candidate = response.candidates[0];

    // Check for non-STOP finish reasons, which indicate an issue.
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        let userMessage;
        switch (candidate.finishReason) {
            case 'SAFETY':
                userMessage = `لم نتمكن من معالجة طلبك لأن الصور المقدمة قد تنتهك سياسات الأمان. يرجى تجربة صور مختلفة.`;
                break;
            case 'RECITATION':
                userMessage = `فشل إنشاء الصورة بسبب مخاوف تتعلق بالانتحال. يرجى تعديل طلبك.`;
                break;
            case 'IMAGE_OTHER':
                userMessage = `فشل معالجة إحدى الصور المدخلة. يرجى التأكد من أن الصور واضحة وعالية الجودة، ثم حاول مرة أخرى. قد يساعد استخدام صور بخلفيات بسيطة.`;
                break;
            default:
                userMessage = `فشل إنشاء الصورة لسبب غير متوقع (${candidate.finishReason}). يرجى المحاولة مرة أخرى لاحقًا.`;
        }
        throw new Error(userMessage);
    }

    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("لم يتمكن النموذج من إنشاء صورة بالمدخلات الحالية. قد يكون هذا بسبب عدم تطابق الصور أو تعقيد الطلب. حاول تبسيط الوصف أو استخدام صور مختلفة.");
    }

    for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("لم يتم العثور على صورة في استجابة النموذج. قد يكون السبب هو أن النموذج لم يتمكن من معالجة الصور المقدمة.");
};


export const generateAnimation = async (imageBase64: string, prompt: string): Promise<string> => {
    // A new GoogleGenAI instance must be created for each call to ensure the latest API key is used.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API key is not configured");
    }
    const ai = new GoogleGenAI({ apiKey });
  
    const mimeType = imageBase64.match(/data:(.*);base64,/)?.[1] || 'image/png';
    const base64Data = imageBase64.split(',')[1];
    
    if (!mimeType.startsWith('image/')) {
        throw new Error("صيغة الصورة غير صالحة للتحريك.");
    }
  
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: base64Data,
          mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '9:16'
        }
      });
  
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
  
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  
      if (!downloadLink) {
          throw new Error("فشل إنشاء الفيديو. لم يتم العثور على رابط التحميل من الـ API.");
      }
  
      const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
      if (!videoResponse.ok) {
          const errorText = await videoResponse.text();
          console.error("Error fetching video data:", errorText);
          if (errorText.includes("Requested entity was not found")) {
               throw new Error("API_KEY_ERROR");
          }
          throw new Error(`فشل في تحميل بيانات الفيديو النهائية: ${videoResponse.statusText}`);
      }
  
      const videoBlob = await videoResponse.blob();
      return URL.createObjectURL(videoBlob);
  
    } catch (err) {
        console.error("Error generating animation:", err);
        if (err instanceof Error) {
            // Re-throw if it's an API_KEY_ERROR we've already classified (e.g., from the final fetch)
            if (err.message.includes("API_KEY_ERROR")) {
                throw err;
            }
            
            const errorMessage = err.message.toLowerCase();
            // The API can return a 404/NOT_FOUND for various key-related issues (invalid key, project not found, billing not enabled, etc.)
            // We will catch these and map them to a user-friendly API_KEY_ERROR.
            if (errorMessage.includes("requested entity was not found") || 
                (errorMessage.includes('"code":404') && errorMessage.includes('"status":"not_found"'))) {
                throw new Error("API_KEY_ERROR");
            }
            
            if (errorMessage.includes('aspect ratio')) {
                throw new Error("فشل إنشاء الفيديو. نسبة أبعاد صورة الموديل غير مدعومة. النموذج الحالي يدعم فقط الأبعاد الطولية (9:16) أو العرضية (16:9). يرجى تجربة موديل آخر.");
            }
        }
        // Fallback for any other type of error
        throw new Error(`حدث خطأ أثناء إنشاء الفيديو: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
};

export const generateVideoFromReferences = async (
  modelVideoFile: File,
  clothingImageFile: File,
  prompt: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API key is not configured");
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    const modelFrameFile = await extractFrameFromVideo(modelVideoFile);

    const modelFramePart = await fileToGenerativePart(modelFrameFile);
    const clothingImagePart = await fileToGenerativePart(clothingImageFile);

    const referenceImagesPayload: VideoGenerationReferenceImage[] = [
      {
        image: {
          imageBytes: modelFramePart.inlineData.data,
          mimeType: modelFramePart.inlineData.mimeType,
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      },
      {
        image: {
          imageBytes: clothingImagePart.inlineData.data,
          mimeType: clothingImagePart.inlineData.mimeType,
        },
        referenceType: VideoGenerationReferenceType.ASSET,
      },
    ];

    const finalPrompt = `
مهمة: إنشاء فيديو واقعي عالي الجودة.
المحتوى:
1.  الشخصية الرئيسية: يجب أن تكون هي نفس الشخص الموجود في الصورة المرجعية الأولى (صورة الموديل).
2.  الملابس: يجب أن ترتدي الشخصية قطعة الملابس من الصورة المرجعية الثانية.
3.  الحركة: يجب أن تقوم الشخصية بتنفيذ الحركة الموصوفة تالياً بدقة: "${prompt}".
4.  الخلفية: حافظ على خلفية بسيطة ومحايدة لا تشتت الانتباه عن الشخصية.
النتيجة النهائية يجب أن تكون فيديو سلس وواقعي يدمج كل هذه العناصر معًا.
    `;

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: finalPrompt,
      config: {
        numberOfVideos: 1,
        referenceImages: referenceImagesPayload,
        resolution: '720p',
        aspectRatio: '16:9',
      },
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("فشل إنشاء الفيديو. لم يتم العثور على رابط التحميل من الـ API.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error("Error fetching video data:", errorText);
      if (errorText.includes("Requested entity was not found")) {
        throw new Error("API_KEY_ERROR");
      }
      throw new Error(`فشل في تحميل بيانات الفيديو النهائية: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);

  } catch (err) {
    console.error("Error generating video from references:", err);
    if (err instanceof Error) {
        // Re-throw if it's an API_KEY_ERROR we've already classified (e.g., from the final fetch)
        if (err.message.includes("API_KEY_ERROR")) {
            throw err;
        }
        
        const errorMessage = err.message.toLowerCase();
        // The API can return a 404/NOT_FOUND for various key-related issues (invalid key, project not found, billing not enabled, etc.)
        // We will catch these and map them to a user-friendly API_KEY_ERROR.
        if (errorMessage.includes("requested entity was not found") || 
            (errorMessage.includes('"code":404') && errorMessage.includes('"status":"not_found"'))) {
            throw new Error("API_KEY_ERROR");
        }
        
        if (errorMessage.includes('aspect ratio') || errorMessage.includes('16:9')) {
            throw new Error("فشل إنشاء الفيديو. هذا الوضع المتقدم يتطلب أن يكون فيديو الموديل الأصلي بنسبة عرض إلى ارتفاع 16:9 (فيديو بالعرض). يرجى تجربة فيديو آخر.");
        }
    }
    // Fallback for any other type of error
    throw new Error(`حدث خطأ أثناء إنشاء الفيديو: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};