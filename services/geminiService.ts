
import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// We use a fallback to prevent crash, but the AI won't work without a valid key
const apiKey = process.env.API_KEY;

// Only initialize if we have a key that looks vaguely real to prevent instantiation errors
const isKeyValid = apiKey && apiKey.length > 10 && apiKey !== "fallback_key_check_vercel_env_vars";

if (!isKeyValid) {
  console.warn("⚠️ API_KEY is missing or invalid. AI features will use fallback text.");
}

// We export 'ai' but we need to handle if it's not initialized properly in the components
export const ai = isKeyValid ? new GoogleGenAI({ apiKey: apiKey! }) : new GoogleGenAI({ apiKey: "dummy_key" });

export const generateHypeMessage = async (context: string): Promise<string> => {
  if (!isKeyValid) {
    return "Fortune favors the bold.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a sophisticated, witty, and professional casino host at 'Pump Casino'. 
      Generate a brief, encouraging, or slightly cheeky comment (max 10 words) reacting to the following game event: ${context}. 
      Do not use crypto slang. Keep it classy.`,
    });

    return response.text?.trim() || "Fortune favors the bold.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Fortune favors the bold.";
  }
};
