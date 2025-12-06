import { GoogleGenAI, Part } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates or edits an image using the gemini-2.5-flash-image (Nano Banana) model.
 * @param prompt The text prompt description.
 * @param base64Image Optional base64 string of an input image for editing context.
 * @param mimeType Optional mime type of the input image.
 */
export const generateImageContent = async (
  prompt: string,
  base64Image?: string | null,
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  try {
    const parts: Part[] = [];

    // If an image is provided, we add it to the request parts (Edit/Transform mode)
    if (base64Image) {
      // Clean base64 string if it contains metadata prefix
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType,
        },
      });
    }

    // Add the text prompt
    parts.push({
      text: prompt,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Mapped from "nano banana" per guidelines
      contents: {
        parts: parts,
      },
      // Note: responseMimeType and responseSchema are NOT supported for this model.
    });

    // Iterate through parts to find the generated image
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("لم يتم إنشاء أي صورة. حاول تعديل الوصف.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.");
  }
};

/**
 * Helper to convert File to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};