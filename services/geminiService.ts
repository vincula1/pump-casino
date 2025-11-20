
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
const apiKey = process.env.API_KEY;

export const isGeminiConfigured = () => {
    // Basic validation: Must exist, not be "undefined" string, and look like a Google Key (starts with AIza)
    // This prevents sending requests with garbage keys which results in 403 errors.
    return !!apiKey && apiKey !== 'undefined' && apiKey.trim() !== '' && apiKey.startsWith('AIza');
};

// We assume the key is valid if it passes isGeminiConfigured.
// If not, we pass a dummy key to satisfy the constructor, but our logic prevents using it.
export const ai = new GoogleGenAI({ apiKey: isGeminiConfigured() ? apiKey : "fallback_key_for_init_only" });

export const generateHypeMessage = async (context: string): Promise<string> => {
  if (!isGeminiConfigured()) {
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
    // Silent failure is preferred for background hype generation
    return "";
  }
};
