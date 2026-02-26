// Main Travel API Service - coordinates all travel services
import { aiSearchService, AIHotel, AIFlight, AICar } from './AISearchService';
import { Hotel, HotelSearchParams, Flight, FlightSearchParams, Car, CarSearchParams } from '../types/api';

class TravelAPI {
  // AI Hotel search - using Gemini AI instead of Amadeus
  async searchHotels(params: HotelSearchParams, userProfile?: any): Promise<Hotel[]> {
    console.log('🏨 TravelAPI: Starting AI hotel search...');
    
    // Map HotelSearchParams to AI search params format
    const aiSearchParams = {
      destination: params.cityCode,
      checkIn: params.checkInDate,
      checkOut: params.checkOutDate,
      guests: params.adults,
      currency: params.currency || 'USD',
    };
    
    console.log('🏨 Mapped AI search params:', aiSearchParams);
    const aiHotels = await aiSearchService.searchHotels(aiSearchParams, userProfile);
    
    // Convert AI hotels to standard Hotel format
    return aiHotels.map(aiHotel => ({
      id: aiHotel.id,
      name: aiHotel.name,
      location: aiHotel.location,
      address: aiHotel.address,
      price: aiHotel.price,
      currency: aiHotel.currency,
      rating: aiHotel.rating,
      description: aiHotel.description,
      amenities: aiHotel.amenities,
      images: aiHotel.images,
      checkIn: aiHotel.checkIn,
      checkOut: aiHotel.checkOut,
      guests: aiHotel.guests
    }));
  }

  // AI Flight search - using Gemini AI instead of Amadeus
  async searchFlights(params: FlightSearchParams, userProfile?: any): Promise<Flight[]> {
    console.log('✈️ TravelAPI: Starting AI flight search...');
    const aiFlights = await aiSearchService.searchFlights(params, userProfile);
    
    // Convert AI flights to standard Flight format
    return aiFlights.map(aiFlight => ({
      id: aiFlight.id,
      airline: aiFlight.airline,
      flightNumber: aiFlight.flightNumber,
      departure: aiFlight.departure,
      arrival: aiFlight.arrival,
      duration: aiFlight.duration,
      stops: aiFlight.stops,
      price: aiFlight.price,
      currency: aiFlight.currency,
      class: aiFlight.class,
      aircraft: aiFlight.aircraft
    }));
  }

  // AI Car search - using Gemini AI instead of Amadeus
  async searchCars(params: CarSearchParams, userProfile?: any): Promise<Car[]> {
    console.log('🚗 TravelAPI: Starting AI car search...');
    const aiCars = await aiSearchService.searchCars(params, userProfile);
    
    // Convert AI cars to standard Car format
    return aiCars.map(aiCar => ({
      id: aiCar.id,
      company: aiCar.company,
      model: aiCar.model,
      category: aiCar.category,
      price: aiCar.price,
      currency: aiCar.currency,
      transmission: aiCar.transmission,
      seats: aiCar.seats,
      fuelType: aiCar.fuelType,
      features: aiCar.features,
      pickupLocation: aiCar.pickupLocation,
      dropoffLocation: aiCar.dropoffLocation,
      images: aiCar.images
    }));
  }
}

export const travelAPI = new TravelAPI();
export type { Hotel, HotelSearchParams, Flight, FlightSearchParams, Car, CarSearchParams };

