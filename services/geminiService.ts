
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
const apiKey = process.env.API_KEY;

// We assume the key is valid. If it's not, the API calls will fail, 
// and the UI components (Chat, Games) will catch the error and show fallback content.
// This is better than blocking the app with a hard crash or dummy check.
export const ai = new GoogleGenAI({ apiKey: apiKey || "fallback_dummy_key" });

export const generateHypeMessage = async (context: string): Promise<string> => {
  if (!apiKey) {
    return ""; // Return empty to let UI handle defaults
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a sophisticated, witty casino host at 'Pump Casino'. 
      Generate a very short (max 6 words) hype comment reacting to: ${context}. 
      Example: "Big win incoming!" or "Ouch, that hurt.".`,
    });

    return response.text?.trim() || "";
  } catch (error) {
    return "";
  }
};
