import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TravelPlan } from '../types/types';


const API_KEY = "AIzaSyAImuoVeZAV2ePHQqx0P481-VH3gmDWFdI"
const genAI = new GoogleGenerativeAI(API_KEY);


export const generateTravelPlan = async (
  destination: string,
  duration: string,
  interests: string,
  maxRetries = 7
): Promise<TravelPlan> => {
  const createFallbackPlan = (): TravelPlan => {
    const durationNum = Number.isFinite(parseInt(duration, 10))
      ? Math.max(1, Math.min(14, parseInt(duration, 10)))
      : 7;
    const d = durationNum;
    const makeDay = (day: number, title: string): { day: number; title: string; activities: { time: string; description: string }[]; foodSuggestion: { name: string; description: string } } => ({
      day,
      title,
      activities: [
        { time: "09:00", description: `Morning walk and sightseeing in ${destination}` },
        { time: "12:30", description: "Lunch at a local spot with regional cuisine" },
        { time: "15:00", description: "Visit a popular museum or cultural site" },
        { time: "18:00", description: "Sunset viewpoint and photography" }
      ],
      foodSuggestion: {
        name: "Chef's Special",
        description: `Try a signature dish inspired by ${interests || "local flavors"}`
      }
    });
    const itinerary = Array.from({ length: d }, (_, i) =>
      makeDay(i + 1, i === 0 ? "Arrival & City Introduction" : i === d - 1 ? "Relaxation & Departure Prep" : "Explore Highlights")
    );
    return {
      destinationName: destination || "Your Destination",
      country: "Unknown",
      itinerary
    };
  };
  const prompt = `Create a detailed travel itinerary for a ${duration}-day trip to ${destination}. 
  The traveler is interested in ${interests}. 
  Return the response as a valid JSON object matching this structure:
  {
    "destinationName": "string",
    "country": "string",
    "itinerary": [
      {
        "day": number,
        "title": "string",
        "activities": [
          {
            "time": "string",
            "description": "string"
          }
        ],
        "foodSuggestion": {
          "name": "string",
          "description": "string"
        }
      }
    ]
  }
  
  Important: 
  - Return ONLY the JSON object
  - No additional text or markdown
  - Ensure valid JSON formatting`;

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          topP: 0.9
        }
      });

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }]
      });

      const response = await result.response;
      const text = response.text();

      let jsonString = text.trim();
      // Remove markdown code block wrappers
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.slice(7, -3).trim();
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.slice(3, -3).trim();
      }

      // Try to extract the first valid JSON object using regex
      const match = jsonString.match(/\{[\s\S]*\}/);
      if (match) {
        jsonString = match[0];
      }

      let plan: TravelPlan;
      try {
        plan = JSON.parse(jsonString) as TravelPlan;
      } catch (parseError) {
        console.error('JSON parse error. Raw response:', text);
        return createFallbackPlan();
      }

      if (!plan?.itinerary?.length || !plan.destinationName) {
        return createFallbackPlan();
      }

      return plan;
    } catch (error: any) {
      if (
        error.message?.includes('503') ||
        error.message?.includes('overloaded')
      ) {
        attempt++;
        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, 1000 * attempt)); // Exponential backoff
          continue;
        }
      }
      console.error('Generation error:', error);
      return createFallbackPlan();
    }
  }
  return createFallbackPlan();
};

export const generateDestinationImage = async (
  destination: string,
  country: string
): Promise<string> => {
  const PIXABAY_KEY = "49759235-6f6ff6476b5452f83b69c7414";
  const query = `${destination} ${country} landmark`;

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3`
    );

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      return data.hits[0].largeImageURL;
    } else {
      throw new Error("No images found.");
    }
  } catch (error) {
    console.error("Image fetch failed:", error);
    return "https://via.placeholder.com/800x600?text=Image+Not+Available";
  }
};
