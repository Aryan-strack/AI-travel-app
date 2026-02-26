export interface Activity {
  time: string;
  description: string;
}

export interface FoodSuggestion {
  name: string;
  description: string;
}

export interface ItineraryDay {
  day: number;
  title: string;
  activities: Activity[];
  foodSuggestion: FoodSuggestion;
}

export interface TravelPlan {
  destinationName: string;
  country: string;
  itinerary: ItineraryDay[];
}