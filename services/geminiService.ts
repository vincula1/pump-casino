import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// We use a fallback string to prevent the app from crashing immediately if the env var is missing in Vercel
const apiKey = process.env.API_KEY || "fallback_key_check_vercel_env_vars";

if (apiKey === "fallback_key_check_vercel_env_vars") {
  console.warn("⚠️ API_KEY is not set. AI features will not function. Please set the API_KEY environment variable in Vercel.");
}

export const ai = new GoogleGenAI({ apiKey });

export const generateHypeMessage = async (context: string): Promise<string> => {
  // Return default if key is missing to save API calls
  if (apiKey === "fallback_key_check_vercel_env_vars") {
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