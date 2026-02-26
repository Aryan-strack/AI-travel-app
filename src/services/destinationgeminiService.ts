
import { GenerateContentResponse, GoogleGenAI, Type } from "@google/genai";
import type { Destination } from '../types/destinationtypes';

const schema = {
  type: Type.OBJECT,
  properties: {
    placeName: {
      type: Type.STRING,
      description: 'The common name of the landmark or location shown in the image.',
    },
    city: {
      type: Type.STRING,
      description: 'The city where the landmark or location is situated.',
    },
    country: {
      type: Type.STRING,
      description: 'The country where the landmark or location is situated.',
    },
    description: {
      type: Type.STRING,
      description: 'A brief, engaging description of the location, suitable for a travel guide.',
    },
    interestingFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: 'A list of three interesting, concise facts about the location.',
    },
  },
  required: ['placeName', 'city', 'country', 'description', 'interestingFacts'],
};

// Set your Gemini API key here
const GEMINI_API_KEY = "AIzaSyBmUjRtrTw5OkIl9dJl6A4klhOq2QI0cT8"; // TODO: Replace with your actual API key

const fileToGenerativePart = async (file: { uri: string; name: string; type: string }) => {
  // Expo/React Native: fetch the file and convert to base64
  const response = await fetch(file.uri);
  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject('Failed to read file as base64');
      }
    };
    reader.readAsDataURL(blob);
  });
  return {
    inlineData: {
      data: base64,
      mimeType: file.type,
    },
  };
};

export const identifyDestination = async (imageFile: { uri: string; name: string; type: string }): Promise<Destination> => {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set. Please provide your Gemini API key in geminiService.ts.");
    }
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const imagePart = await fileToGenerativePart(imageFile);
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                imagePart,
                { text: 'Identify the landmark or location in this image. Provide the name of the place, its city, country, a short description, and three interesting facts about it. Respond in JSON format according to the provided schema. If the location is not identifiable as a known landmark, respond with an error structure.' }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    });

    if (!response.text) {
      throw new Error("Empty response from API.");
    }
    const jsonString = response.text.trim();
    if (!jsonString) {
      throw new Error("Empty response from API.");
    }

    try {
      const result = JSON.parse(jsonString);
      return result as Destination;
    } catch (e) {
      console.error("Failed to parse JSON response:", jsonString);
      throw new Error("Invalid response format from API.");
    }
};