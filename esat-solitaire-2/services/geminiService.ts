import { GoogleGenAI } from "@google/genai";

export const generateCardBackImage = async (prompt: string): Promise<string | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key not found");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-2.5-flash-image as recommended for general image tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Design a playing card back pattern. Style: ${prompt}. High contrast, seamless pattern, artistic, no text, vertical aspect ratio 3:4.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          // imageSize: "1K" // Optional, default is 1K
        }
      },
    });

    // Extract image from response
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};