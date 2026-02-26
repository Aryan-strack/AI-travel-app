// Car Service for Amadeus API integration
import { Car, CarSearchParams } from '../types/api';
import { ImageService } from './ImageService';

const AMADEUS_API_KEY = '';
const AMADEUS_API_SECRET = '';
const AMADEUS_BASE_URL = '';

class CarService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Get access token for Amadeus API
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('Requesting Amadeus access token for cars...');
      
      const body = `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`;
      
      const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      console.log('Car token response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Car token request failed:', response.status, errorText);
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Map city names to location codes
  private getLocationCode(cityName: string): string {
    const locationMap: { [key: string]: string } = {
      'london': 'LHR', // London Heathrow
      'paris': 'CDG', // Paris Charles de Gaulle
      'new york': 'JFK', // New York JFK
      'tokyo': 'NRT', // Tokyo Narita
      'dubai': 'DXB', // Dubai International
      'singapore': 'SIN', // Singapore Changi
      'sydney': 'SYD', // Sydney Kingsford Smith
      'berlin': 'TXL', // Berlin Tegel
      'rome': 'FCO', // Rome Fiumicino
      'madrid': 'MAD', // Madrid Barajas
      'amsterdam': 'AMS', // Amsterdam Schiphol
      'barcelona': 'BCN', // Barcelona El Prat
      'munich': 'MUC', // Munich Airport
      'vienna': 'VIE', // Vienna International
      'zurich': 'ZUR', // Zurich Airport
    };

    const normalizedCity = cityName.toLowerCase().trim();
    return locationMap[normalizedCity] || 'LHR'; // Default to London Heathrow
  }

  // Search cars using Amadeus API
  async searchCars(params: CarSearchParams): Promise<Car[]> {
    try {
      console.log('Starting car search with params:', params);
      
      // For now, skip the API call and use mock data directly
      // The Amadeus car rental API has limited coverage and often returns 404
      console.log('Using mock car data for better user experience');
      return this.getMockCars(params.pickUpLocation);
      
      // TODO: Re-enable API calls when Amadeus car rental coverage improves
      /*
      const token = await this.getAccessToken();
      console.log('Got car access token, proceeding with API calls...');
      
      // Convert city names to location codes
      const pickUpLocationCode = this.getLocationCode(params.pickUpLocation);
      const dropOffLocationCode = params.dropOffLocation ? this.getLocationCode(params.dropOffLocation) : pickUpLocationCode;
      
      console.log(`Mapped ${params.pickUpLocation} to ${pickUpLocationCode}`);
      if (params.dropOffLocation) {
        console.log(`Mapped ${params.dropOffLocation} to ${dropOffLocationCode}`);
      }
      
      const queryParams = new URLSearchParams({
        pickUpLocationCode: pickUpLocationCode,
        pickUpDateTime: `${params.pickUpDate}T10:00:00`,
        dropOffDateTime: `${params.dropOffDate}T10:00:00`,
        driverAge: params.driverAge.toString(),
        currencyCode: params.currency || 'USD',
      });

      if (params.dropOffLocation) {
        queryParams.append('dropOffLocationCode', dropOffLocationCode);
      }

      console.log('Car search URL:', `${AMADEUS_BASE_URL}/v1/shopping/car-rental-offers?${queryParams}`);

      const response = await fetch(
        `${AMADEUS_BASE_URL}/v1/shopping/car-rental-offers?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Car search API error:', response.status, errorText);
        console.log('Falling back to mock cars due to API error');
        return this.getMockCars(params.pickUpLocation);
      }

      const data = await response.json();
      console.log('Car search response:', data);

      return this.transformCarData(data);
      */
    } catch (error) {
      console.error('Car search error:', error);
      console.log('Falling back to mock cars due to general error');
      return this.getMockCars(params.pickUpLocation);
    }
  }

  // Transform car data
  private transformCarData(apiData: any): Car[] {
    if (!apiData.data || !Array.isArray(apiData.data)) {
      console.log('No car data found, using mock data');
      return this.getMockCars();
    }

    return apiData.data.slice(0, 10).map((offer: any, index: number) => {
      const vehicle = offer.car;
      
      return {
        id: offer.id || `car-${index}`,
        company: offer.provider.name || 'Car Rental',
        model: vehicle.model || 'Standard Car',
        category: vehicle.category || 'Economy',
        transmission: vehicle.transmission || 'Automatic',
        fuelType: vehicle.fuelType || 'Gasoline',
        seats: vehicle.seats || 5,
        price: Math.floor(parseFloat(offer.price.total)),
        currency: offer.price.currency || 'USD',
        image: ImageService.getCarImage(vehicle.category),
        features: vehicle.features || ['Air Conditioning', 'GPS'],
        location: offer.pickUpLocation.address || 'Airport',
      };
    });
  }

  // Mock cars as fallback
  private getMockCars(location: string = 'London'): Car[] {
    const locationSpecificCars = {
      'london': [
        {
          id: '1',
          company: 'Hertz',
          model: 'Toyota Camry',
          category: 'INTERMEDIATE',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          price: 45,
          currency: 'GBP',
          image: ImageService.getCarImage('INTERMEDIATE'),
          features: ['Air Conditioning', 'GPS', 'Bluetooth'],
          location: 'London Heathrow Airport',
        },
        {
          id: '2',
          company: 'Avis',
          model: 'BMW 3 Series',
          category: 'PREMIUM',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          price: 85,
          currency: 'GBP',
          image: ImageService.getCarImage('PREMIUM'),
          features: ['Air Conditioning', 'GPS', 'Leather Seats', 'Sunroof'],
          location: 'London City Center',
        },
        {
          id: '3',
          company: 'Enterprise',
          model: 'Ford Explorer',
          category: 'SUV',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 7,
          price: 75,
          currency: 'GBP',
          image: ImageService.getCarImage('SUV'),
          features: ['Air Conditioning', 'GPS', 'Third Row Seating', 'AWD'],
          location: 'London Paddington',
        },
        {
          id: '4',
          company: 'Budget',
          model: 'Vauxhall Corsa',
          category: 'ECONOMY',
          transmission: 'Manual',
          fuelType: 'Gasoline',
          seats: 5,
          price: 25,
          currency: 'GBP',
          image: ImageService.getCarImage('ECONOMY'),
          features: ['Air Conditioning', 'Radio'],
          location: 'London Gatwick Airport',
        },
        {
          id: '5',
          company: 'Europcar',
          model: 'Mercedes C-Class',
          category: 'LUXURY',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          price: 120,
          currency: 'GBP',
          image: ImageService.getCarImage('LUXURY'),
          features: ['Air Conditioning', 'GPS', 'Leather Seats', 'Premium Sound', 'Heated Seats'],
          location: 'London Victoria',
        },
      ],
      'paris': [
        {
          id: '1',
          company: 'Hertz',
          model: 'Peugeot 308',
          category: 'INTERMEDIATE',
          transmission: 'Manual',
          fuelType: 'Diesel',
          seats: 5,
          price: 40,
          currency: 'EUR',
          image: ImageService.getCarImage('INTERMEDIATE'),
          features: ['Air Conditioning', 'GPS', 'Bluetooth'],
          location: 'Paris Charles de Gaulle Airport',
        },
        {
          id: '2',
          company: 'Avis',
          model: 'BMW 3 Series',
          category: 'PREMIUM',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          price: 80,
          currency: 'EUR',
          image: ImageService.getCarImage('PREMIUM'),
          features: ['Air Conditioning', 'GPS', 'Leather Seats', 'Sunroof'],
          location: 'Paris City Center',
        },
        {
          id: '3',
          company: 'Europcar',
          model: 'Renault Clio',
          category: 'ECONOMY',
          transmission: 'Manual',
          fuelType: 'Diesel',
          seats: 5,
          price: 30,
          currency: 'EUR',
          image: ImageService.getCarImage('ECONOMY'),
          features: ['Air Conditioning', 'Radio'],
          location: 'Paris Orly Airport',
        },
      ],
    };

    const normalizedLocation = location.toLowerCase();
    let cars = locationSpecificCars[normalizedLocation];
    
    // If no specific location data, create generic cars for the location
    if (!cars) {
      cars = [
        {
          id: '1',
          company: 'Hertz',
          model: 'Toyota Camry',
          category: 'INTERMEDIATE',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          price: 45,
          currency: 'USD',
          image: ImageService.getCarImage('INTERMEDIATE'),
          features: ['Air Conditioning', 'GPS', 'Bluetooth'],
          location: `${location} Airport`,
        },
        {
          id: '2',
          company: 'Avis',
          model: 'BMW 3 Series',
          category: 'PREMIUM',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 5,
          price: 85,
          currency: 'USD',
          image: ImageService.getCarImage('PREMIUM'),
          features: ['Air Conditioning', 'GPS', 'Leather Seats', 'Sunroof'],
          location: `${location} City Center`,
        },
        {
          id: '3',
          company: 'Enterprise',
          model: 'Ford Explorer',
          category: 'SUV',
          transmission: 'Automatic',
          fuelType: 'Gasoline',
          seats: 7,
          price: 75,
          currency: 'USD',
          image: ImageService.getCarImage('SUV'),
          features: ['Air Conditioning', 'GPS', 'Third Row Seating', 'AWD'],
          location: `${location} Downtown`,
        },
      ];
    }
    
    return cars;
  }
}

export const carService = new CarService();

