import { GoogleGenAI, Type } from "@google/genai";
import { ParsedEventData } from "../types";

const SYSTEM_INSTRUCTION = `
You are a smart scheduling assistant. Your job is to extract calendar event details from natural language text.
You must return a strict JSON object.

Rules:
1. 'start' and 'end' must be in ISO 8601 format (e.g., 2023-10-27T14:30:00).
2. If the user provides a relative date (e.g., "tomorrow", "next Friday"), calculate the date based on the 'referenceTime' provided in the user prompt.
3. If no duration is specified, assume 1 hour.
4. If no time is specified (only a date), set 'allDay' to true, and set start/end to the date string YYYY-MM-DD.
5. If 'allDay' is true, start and end should just be the YYYY-MM-DD string.
6. 'summary' is the main title of the task.
`;

export const parseTaskWithGemini = async (text: string): Promise<ParsedEventData> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const referenceTime = new Date().toISOString();
  
  const prompt = `
    User Text: "${text}"
    Current Reference Time: ${referenceTime}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            start: { type: Type.STRING },
            end: { type: Type.STRING },
            description: { type: Type.STRING },
            location: { type: Type.STRING },
            allDay: { type: Type.BOOLEAN },
          },
          required: ["summary", "start", "end", "allDay"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");

    return JSON.parse(resultText) as ParsedEventData;
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw error;
  }
};