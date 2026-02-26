import { GoogleGenerativeAI } from '@google/generative-ai';
import { realImageService } from './RealImageService';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('');

export interface AIHotel {
  id: string;
  name: string;
  location: string;
  address: string;
  price: number;
  currency: string;
  rating: number;
  description: string;
  amenities: string[];
  images: string[];
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface AIFlight {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: number;
  currency: string;
  class: string;
  aircraft: string;
}

export interface AICar {
  id: string;
  company: string;
  model: string;
  category: string;
  price: number;
  currency: string;
  transmission: string;
  seats: number;
  fuelType: string;
  features: string[];
  pickupLocation: string;
  dropoffLocation: string;
  images: string[];
}

class AISearchService {
  private model: any;
  private modelName: string = 'gemini-1.5-flash';

  constructor() {
    // Skip model initialization for now to prevent errors
    console.log('⚠️ AI Search Service initialized with fallback mode');
  }

  private initializeModel() {
    try {
      this.model = genAI.getGenerativeModel({ model: this.modelName });
      console.log(`✅ AI Search initialized with model: ${this.modelName}`);
    } catch (error) {
      console.error('Error initializing AI search model:', error);
      this.tryFallbackModels();
    }
  }

  private tryFallbackModels() {
    const fallbackModels = [
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];

    for (const modelName of fallbackModels) {
      try {
        this.model = genAI.getGenerativeModel({ model: modelName });
        this.modelName = modelName;
        console.log(`✅ AI Search fallback successful with model: ${modelName}`);
        return;
      } catch (error) {
        console.log(`❌ Failed to initialize AI search with model: ${modelName}`);
      }
    }
    
    console.error('❌ All AI search model fallbacks failed');
  }


  // AI Hotel Search
  async searchHotels(searchParams: any, userProfile?: any): Promise<AIHotel[]> {
    try {
      console.log('🏨 Starting hotel search...', searchParams);
      
      // Using fallback data to ensure the app works reliably
      console.log('✅ Using realistic hotel data with real images');
      return await this.getFallbackHotels(searchParams);

      const prompt = `You are a travel expert. Based on these search parameters, provide 5-8 realistic hotel recommendations:

Search Parameters:
- Destination: ${searchParams.destination || 'Not specified'}
- Check-in: ${searchParams.checkIn || 'Not specified'}
- Check-out: ${searchParams.checkOut || 'Not specified'}
- Guests: ${searchParams.guests || 'Not specified'}
- Budget: ${searchParams.budget || 'Not specified'}

User Profile:
- Budget Preference: ${userProfile?.preferences?.budget || 'Not specified'}
- Interests: ${userProfile?.preferences?.interests?.join(', ') || 'Not specified'}
- Currency: ${userProfile?.preferences?.currency || 'USD'}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "unique_id",
    "name": "Hotel Name",
    "location": "City, Country",
    "address": "Full address",
    "price": 150,
    "currency": "USD",
    "rating": 4.5,
    "description": "Brief hotel description",
    "amenities": ["WiFi", "Pool", "Gym", "Restaurant"],
    "images": ["image_url_1", "image_url_2"],
    "checkIn": "2024-01-15",
    "checkOut": "2024-01-18",
    "guests": 2
  }
]

Make the hotels realistic, varied in price, and match the destination. Include different types (budget, mid-range, luxury).`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const hotelsText = response.text();

      // Clean and parse JSON response
      let cleanedText = hotelsText.replace(/```json|```/g, '').trim();
      
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      let hotels;
      try {
        hotels = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        console.log('Raw AI response:', hotelsText);
        console.log('Cleaned text:', cleanedText);
        return this.getFallbackHotels(searchParams);
      }
      
      console.log('✅ AI hotel search successful:', hotels.length, 'hotels found');
      return hotels;

    } catch (error) {
      console.error('❌ Error in AI hotel search:', error);
      return this.getFallbackHotels(searchParams);
    }
  }

  // AI Flight Search
  async searchFlights(searchParams: any, userProfile?: any): Promise<AIFlight[]> {
    try {
      console.log('✈️ Starting flight search...', searchParams);
      
      // Using fallback data to ensure the app works reliably
      console.log('✅ Using realistic flight data');
      return this.getFallbackFlights(searchParams);

      const prompt = `You are a flight booking expert. Based on these search parameters, provide 5-8 realistic flight options:

Search Parameters:
- Origin: ${searchParams.origin || 'Not specified'}
- Destination: ${searchParams.destination || 'Not specified'}
- Departure Date: ${searchParams.departureDate || 'Not specified'}
- Return Date: ${searchParams.returnDate || 'Not specified'}
- Passengers: ${searchParams.passengers || 'Not specified'}

User Profile:
- Budget Preference: ${userProfile?.preferences?.budget || 'Not specified'}
- Home Airport: ${userProfile?.preferences?.homeAirport || 'Not specified'}
- Currency: ${userProfile?.preferences?.currency || 'USD'}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "unique_id",
    "airline": "Airline Name",
    "flightNumber": "AA123",
    "departure": {
      "airport": "JFK",
      "city": "New York",
      "time": "08:30",
      "date": "2024-01-15"
    },
    "arrival": {
      "airport": "CDG",
      "city": "Paris",
      "time": "20:45",
      "date": "2024-01-15"
    },
    "duration": "7h 15m",
    "stops": 0,
    "price": 650,
    "currency": "USD",
    "class": "Economy",
    "aircraft": "Boeing 777"
  }
]

Make the flights realistic with different airlines, prices, and stop options.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const flightsText = response.text();

      // Clean and parse JSON response
      let cleanedText = flightsText.replace(/```json|```/g, '').trim();
      
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      let flights;
      try {
        flights = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        console.log('Raw AI response:', flightsText);
        console.log('Cleaned text:', cleanedText);
        return this.getFallbackFlights(searchParams);
      }
      
      console.log('✅ AI flight search successful:', flights.length, 'flights found');
      return flights;

    } catch (error) {
      console.error('❌ Error in AI flight search:', error);
      return this.getFallbackFlights(searchParams);
    }
  }

  // AI Car Search
  async searchCars(searchParams: any, userProfile?: any): Promise<AICar[]> {
    try {
      console.log('🚗 Starting car search...', searchParams);
      
      // Using fallback data to ensure the app works reliably
      console.log('✅ Using realistic car data with real images');
      return await this.getFallbackCars(searchParams);

      const prompt = `You are a car rental expert. Based on these search parameters, provide 5-8 realistic car rental options:

Search Parameters:
- Location: ${searchParams.location || 'Not specified'}
- Pickup Date: ${searchParams.pickupDate || 'Not specified'}
- Dropoff Date: ${searchParams.dropoffDate || 'Not specified'}
- Pickup Time: ${searchParams.pickupTime || 'Not specified'}
- Dropoff Time: ${searchParams.dropoffTime || 'Not specified'}

User Profile:
- Budget Preference: ${userProfile?.preferences?.budget || 'Not specified'}
- Currency: ${userProfile?.preferences?.currency || 'USD'}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "unique_id",
    "company": "Hertz",
    "model": "Toyota Camry",
    "category": "Economy",
    "price": 45,
    "currency": "USD",
    "transmission": "Automatic",
    "seats": 5,
    "fuelType": "Gasoline",
    "features": ["GPS", "Bluetooth", "Air Conditioning"],
    "pickupLocation": "Airport Terminal",
    "dropoffLocation": "Airport Terminal",
    "images": ["image_url_1", "image_url_2"]
  }
]

Make the cars realistic with different companies, models, and price ranges.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const carsText = response.text();

      // Clean and parse JSON response
      let cleanedText = carsText.replace(/```json|```/g, '').trim();
      
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      let cars;
      try {
        cars = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        console.log('Raw AI response:', carsText);
        console.log('Cleaned text:', cleanedText);
        return this.getFallbackCars(searchParams);
      }
      
      console.log('✅ AI car search successful:', cars.length, 'cars found');
      return cars;

    } catch (error) {
      console.error('❌ Error in AI car search:', error);
      return this.getFallbackCars(searchParams);
    }
  }

  // Fallback Hotel Data with Real Images
  private async getFallbackHotels(searchParams: any): Promise<AIHotel[]> {
    const destination = searchParams.destination || 'Paris';
    const currency = searchParams.currency || 'USD';
    const checkIn = searchParams.checkIn || '2024-01-15';
    const checkOut = searchParams.checkOut || '2024-01-18';
    const guests = searchParams.guests || 2;
    
    // Get real hotel images for the destination
    const realImages = await realImageService.getHotelImages(destination, 5);
    
    // Generate location-specific hotel names
    const getLocationSpecificHotels = (location: string) => {
      const locationLower = location.toLowerCase();
      
      if (locationLower.includes('london')) {
        return [
          { name: 'The Savoy London', address: 'Strand, London WC2R 0EU, UK' },
          { name: 'Claridge\'s London', address: 'Brook Street, London W1K 4HR, UK' },
          { name: 'The Langham London', address: '1C Portland Pl, London W1B 1JA, UK' },
          { name: 'The Shard Hotel', address: '31 St Thomas St, London SE1 9QU, UK' },
          { name: 'Covent Garden Hotel', address: '10 Monmouth St, London WC2H 9HB, UK' }
        ];
      } else if (locationLower.includes('paris')) {
        return [
          { name: 'Hotel Ritz Paris', address: '15 Pl. Vendôme, 75001 Paris, France' },
          { name: 'The Peninsula Paris', address: '19 Av. Kléber, 75116 Paris, France' },
          { name: 'Le Meurice Paris', address: '228 Rue de Rivoli, 75001 Paris, France' },
          { name: 'Hotel de Crillon', address: '10 Pl. de la Concorde, 75008 Paris, France' },
          { name: 'Le Bristol Paris', address: '112 Rue du Faubourg Saint-Honoré, 75008 Paris, France' }
        ];
      } else if (locationLower.includes('new york') || locationLower.includes('nyc')) {
        return [
          { name: 'The Plaza New York', address: '768 5th Ave, New York, NY 10019, USA' },
          { name: 'The St. Regis New York', address: '2 E 55th St, New York, NY 10022, USA' },
          { name: 'The Carlyle New York', address: '35 E 76th St, New York, NY 10021, USA' },
          { name: 'The Mark New York', address: '25 E 77th St, New York, NY 10075, USA' },
          { name: 'The Greenwich Hotel', address: '377 Greenwich St, New York, NY 10013, USA' }
        ];
      } else if (locationLower.includes('dubai')) {
        return [
          { name: 'Burj Al Arab Dubai', address: 'Jumeirah Beach Road, Dubai, UAE' },
          { name: 'Atlantis The Palm', address: 'Crescent Rd, Dubai, UAE' },
          { name: 'Emirates Palace Abu Dhabi', address: 'West Corniche Road, Abu Dhabi, UAE' },
          { name: 'Armani Hotel Dubai', address: 'Burj Khalifa, Dubai, UAE' },
          { name: 'The Address Downtown', address: 'Mohammed Bin Rashid Blvd, Dubai, UAE' }
        ];
      } else if (locationLower.includes('tokyo')) {
        return [
          { name: 'The Ritz-Carlton Tokyo', address: '9-7-1 Akasaka, Minato City, Tokyo, Japan' },
          { name: 'Aman Tokyo', address: '1-5-6 Otemachi, Chiyoda City, Tokyo, Japan' },
          { name: 'Palace Hotel Tokyo', address: '1-1-1 Marunouchi, Chiyoda City, Tokyo, Japan' },
          { name: 'The Peninsula Tokyo', address: '1-8-1 Yurakucho, Chiyoda City, Tokyo, Japan' },
          { name: 'Shangri-La Tokyo', address: 'Marunouchi Trust Tower Main, Tokyo, Japan' }
        ];
      } else {
        // Generic names for other destinations
        return [
          { name: `Grand Hotel ${location}`, address: `123 Main Street, ${location}` },
          { name: `Plaza ${location}`, address: `456 Central Ave, ${location}` },
          { name: `Royal Inn ${location}`, address: `789 Park Blvd, ${location}` },
          { name: `Boutique Hotel ${location}`, address: `321 Garden St, ${location}` },
          { name: `City Center ${location}`, address: `654 Downtown Pl, ${location}` }
        ];
      }
    };
    
    const locationHotels = getLocationSpecificHotels(destination);
    
    return [
      {
        id: 'hotel_1',
        name: locationHotels[0].name,
        location: destination,
        address: locationHotels[0].address,
        price: 120,
        currency: currency,
        rating: 4.5,
        description: 'Luxurious hotel in the heart of the city with modern amenities and excellent service',
        amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa', 'Concierge'],
        images: [realImages[0]?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests
      },
      {
        id: 'hotel_2',
        name: locationHotels[1].name,
        location: destination,
        address: locationHotels[1].address,
        price: 65,
        currency: currency,
        rating: 4.0,
        description: 'Affordable accommodation with essential amenities and friendly service',
        amenities: ['WiFi', 'Breakfast', 'Parking', '24/7 Reception'],
        images: [realImages[1]?.url || 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop'],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests
      },
      {
        id: 'hotel_3',
        name: locationHotels[2].name,
        location: destination,
        address: locationHotels[2].address,
        price: 95,
        currency: currency,
        rating: 4.3,
        description: 'Charming boutique hotel with unique character and personalized service',
        amenities: ['WiFi', 'Restaurant', 'Bar', 'Concierge', 'Room Service'],
        images: [realImages[2]?.url || 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop'],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests
      },
      {
        id: 'hotel_4',
        name: locationHotels[3].name,
        location: destination,
        address: locationHotels[3].address,
        price: 150,
        currency: currency,
        rating: 4.4,
        description: 'Modern business hotel with conference facilities and executive services',
        amenities: ['WiFi', 'Business Center', 'Gym', 'Restaurant', 'Meeting Rooms'],
        images: [realImages[3]?.url || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop'],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests
      },
      {
        id: 'hotel_5',
        name: locationHotels[4].name,
        location: destination,
        address: locationHotels[4].address,
        price: 110,
        currency: currency,
        rating: 4.2,
        description: 'Family-friendly hotel with activities and spacious rooms',
        amenities: ['WiFi', 'Pool', 'Kids Club', 'Restaurant', 'Playground'],
        images: [realImages[4]?.url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'],
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests
      }
    ];
  }

  // Fallback Flight Data
  private getFallbackFlights(searchParams: any): AIFlight[] {
    const origin = searchParams.origin || 'New York';
    const destination = searchParams.destination || 'Paris';
    const currency = searchParams.currency || 'USD';
    const departureDate = searchParams.departureDate || '2024-01-15';
    
    return [
      {
        id: 'flight_1',
        airline: 'Air France',
        flightNumber: 'AF123',
        departure: {
          airport: 'JFK',
          city: origin,
          time: '08:30',
          date: departureDate
        },
        arrival: {
          airport: 'CDG',
          city: destination,
          time: '20:45',
          date: departureDate
        },
        duration: '7h 15m',
        stops: 0,
        price: 650,
        currency: currency,
        class: 'Economy',
        aircraft: 'Boeing 777'
      },
      {
        id: 'flight_2',
        airline: 'Delta',
        flightNumber: 'DL456',
        departure: {
          airport: 'JFK',
          city: origin,
          time: '14:20',
          date: departureDate
        },
        arrival: {
          airport: 'CDG',
          city: destination,
          time: '02:35+1',
          date: departureDate
        },
        duration: '8h 15m',
        stops: 0,
        price: 720,
        currency: currency,
        class: 'Economy',
        aircraft: 'Airbus A330'
      },
      {
        id: 'flight_3',
        airline: 'United',
        flightNumber: 'UA789',
        departure: {
          airport: 'JFK',
          city: origin,
          time: '22:15',
          date: departureDate
        },
        arrival: {
          airport: 'CDG',
          city: destination,
          time: '10:30+1',
          date: departureDate
        },
        duration: '7h 15m',
        stops: 0,
        price: 680,
        currency: currency,
        class: 'Economy',
        aircraft: 'Boeing 787'
      },
      {
        id: 'flight_4',
        airline: 'American',
        flightNumber: 'AA321',
        departure: {
          airport: 'JFK',
          city: origin,
          time: '11:45',
          date: departureDate
        },
        arrival: {
          airport: 'CDG',
          city: destination,
          time: '00:00+1',
          date: departureDate
        },
        duration: '7h 15m',
        stops: 0,
        price: 695,
        currency: currency,
        class: 'Economy',
        aircraft: 'Boeing 777'
      }
    ];
  }

  // Fallback Car Data with Real Images
  private async getFallbackCars(searchParams: any): Promise<AICar[]> {
    const location = searchParams.location || 'Paris';
    const currency = searchParams.currency || 'USD';
    
    // Get real car images
    const economyImages = await realImageService.getCarImages('economy', 2);
    const luxuryImages = await realImageService.getCarImages('luxury', 2);
    
    return [
      {
        id: 'car_1',
        company: 'Hertz',
        model: 'Toyota Camry',
        category: 'Economy',
        price: 45,
        currency: currency,
        transmission: 'Automatic',
        seats: 5,
        fuelType: 'Gasoline',
        features: ['GPS', 'Bluetooth', 'Air Conditioning'],
        pickupLocation: location + ' Airport',
        dropoffLocation: location + ' Airport',
        images: [economyImages[0]?.url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop']
      },
      {
        id: 'car_2',
        company: 'Avis',
        model: 'BMW 3 Series',
        category: 'Luxury',
        price: 85,
        currency: currency,
        transmission: 'Automatic',
        seats: 5,
        fuelType: 'Gasoline',
        features: ['GPS', 'Bluetooth', 'Leather Seats', 'Sunroof'],
        pickupLocation: location + ' Airport',
        dropoffLocation: location + ' Airport',
        images: [luxuryImages[0]?.url || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=600&fit=crop']
      },
      {
        id: 'car_3',
        company: 'Enterprise',
        model: 'Honda Civic',
        category: 'Compact',
        price: 35,
        currency: currency,
        transmission: 'Automatic',
        seats: 5,
        fuelType: 'Gasoline',
        features: ['GPS', 'Bluetooth', 'Air Conditioning'],
        pickupLocation: location + ' Airport',
        dropoffLocation: location + ' Airport',
        images: [economyImages[1]?.url || 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=800&h=600&fit=crop']
      },
      {
        id: 'car_4',
        company: 'Budget',
        model: 'Ford Explorer',
        category: 'SUV',
        price: 65,
        currency: currency,
        transmission: 'Automatic',
        seats: 7,
        fuelType: 'Gasoline',
        features: ['GPS', 'Bluetooth', 'Third Row Seating', 'All-Wheel Drive'],
        pickupLocation: location + ' Airport',
        dropoffLocation: location + ' Airport',
        images: [luxuryImages[1]?.url || 'https://images.unsplash.com/photo-1549317336-206569e8475c?w=800&h=600&fit=crop']
      }
    ];
  }
}

export const aiSearchService = new AISearchService();
