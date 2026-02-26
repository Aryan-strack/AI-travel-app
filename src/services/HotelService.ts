// Hotel Service for Amadeus API integration
import { Hotel, HotelSearchParams } from '../types/api';
import { ImageService } from './ImageService';

const AMADEUS_API_KEY = 'vJ7GWJX57u0MAMFbVL6XBQegcFqyeO4W';
const AMADEUS_API_SECRET = 'NrYrHCig2SOAEtjB';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

class HotelService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Get access token for Amadeus API
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('Requesting Amadeus access token...');
      
      const body = `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`;
      
      const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      console.log('Token response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token request failed:', response.status, errorText);
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Token response data:', data);
      
      if (!data.access_token) {
        throw new Error('No access token in response');
      }
      
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      console.log('Access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      // Return a fallback token or throw error
      throw error;
    }
  }

  // Search hotels using Amadeus API
  async searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
    try {
      console.log('Starting hotel search with params:', params);
      
      const token = await this.getAccessToken();
      console.log('Got access token, proceeding with API calls...');
      
      // Step 1: Get hotels by city
      const hotelsResponse = await fetch(
        `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city?cityCode=${params.cityCode}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!hotelsResponse.ok) {
        const errorText = await hotelsResponse.text();
        console.error('Hotel list API error:', hotelsResponse.status, errorText);
        console.log('Falling back to mock data due to API error');
        return this.getMockHotels();
      }

      const hotelsData = await hotelsResponse.json();
      console.log('Hotel list response:', hotelsData);

      if (!hotelsData.data || hotelsData.data.length === 0) {
        console.log('No hotels found for city, using mock data');
        return this.getMockHotels();
      }

      // Step 2: Get offers for the first 10 hotels
      const hotelIds = hotelsData.data.slice(0, 10).map((hotel: any) => hotel.hotelId).join(',');
      
      const queryParams = new URLSearchParams({
        hotelIds: hotelIds,
        checkInDate: params.checkInDate,
        checkOutDate: params.checkOutDate,
        adults: params.adults.toString(),
        roomQuantity: params.roomQuantity.toString(),
        currency: params.currency || 'USD',
      });

      const offersResponse = await fetch(
        `${AMADEUS_BASE_URL}/v3/shopping/hotel-offers?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!offersResponse.ok) {
        const errorText = await offersResponse.text();
        console.error('Hotel offers API error:', offersResponse.status, errorText);
        console.log('Falling back to mock data due to offers API error');
        return this.getMockHotels();
      }

      const offersData = await offersResponse.json();
      console.log('Hotel offers response:', offersData);

      return this.transformHotelData(offersData, params.cityCode);
    } catch (error) {
      console.error('Hotel search error:', error);
      console.log('Falling back to mock data due to general error');
      return this.getMockHotels();
    }
  }

  // Transform API data to our Hotel interface
  private transformHotelData(apiData: any, cityCode: string): Hotel[] {
    if (!apiData.data || !Array.isArray(apiData.data)) {
      console.log('No hotel data found, using mock data');
      return this.getMockHotels();
    }

    return apiData.data.map((hotel: any, index: number) => {
      const offer = hotel.offers[0];
      const price = offer ? Math.floor(parseFloat(offer.price.total)) : Math.floor(Math.random() * 500) + 100;
      
      // Better address handling
      let address = 'Address not available';
      if (hotel.hotel.address) {
        if (hotel.hotel.address.lines && hotel.hotel.address.lines.length > 0) {
          address = hotel.hotel.address.lines.join(', ');
        } else if (hotel.hotel.address.streetNumber && hotel.hotel.address.streetName) {
          address = `${hotel.hotel.address.streetNumber} ${hotel.hotel.address.streetName}`;
          if (hotel.hotel.address.cityName) {
            address += `, ${hotel.hotel.address.cityName}`;
          }
          if (hotel.hotel.address.countryCode) {
            address += `, ${hotel.hotel.address.countryCode}`;
          }
        } else if (hotel.hotel.address.cityName) {
          address = hotel.hotel.address.cityName;
          if (hotel.hotel.address.countryCode) {
            address += `, ${hotel.hotel.address.countryCode}`;
          }
        }
      }
      
      return {
        id: hotel.hotel.hotelId || `hotel-${index}`,
        name: hotel.hotel.name || 'Unknown Hotel',
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        price: price,
        currency: offer?.price?.currency || 'USD',
        address: address,
        amenities: this.getRandomAmenities(),
        images: ImageService.getLocationBasedImages(cityCode, index, 3),
        coordinates: {
          latitude: hotel.hotel.latitude || 0,
          longitude: hotel.hotel.longitude || 0,
        },
      };
    });
  }

  // Get random amenities for hotels
  private getRandomAmenities(): string[] {
    const allAmenities = [
      'Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Room Service',
      'Concierge', 'Parking', 'Airport Shuttle', 'Business Center', 'Pet Friendly'
    ];
    
    const count = Math.floor(Math.random() * 4) + 3; // 3-6 amenities
    return allAmenities.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  // Mock hotels as fallback
  private getMockHotels(): Hotel[] {
    return [
      {
        id: '1',
        name: 'The Ritz Paris',
        rating: 4.8,
        price: 450,
        currency: 'USD',
        address: '15 Place Vendôme, 75001 Paris, France',
        amenities: ['Free WiFi', 'Spa', 'Restaurant', 'Concierge', 'Room Service'],
        images: ImageService.getLocationBasedImages('PAR', 0, 3),
        coordinates: { latitude: 48.8674, longitude: 2.3306 },
      },
      {
        id: '2',
        name: 'The Savoy London',
        rating: 4.7,
        price: 380,
        currency: 'USD',
        address: 'Strand, London WC2R 0EU, UK',
        amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Concierge'],
        images: ImageService.getLocationBasedImages('LON', 1, 3),
        coordinates: { latitude: 51.5107, longitude: -0.1200 },
      },
      {
        id: '3',
        name: 'The Plaza New York',
        rating: 4.6,
        price: 520,
        currency: 'USD',
        address: '768 5th Ave, New York, NY 10019, USA',
        amenities: ['Free WiFi', 'Spa', 'Restaurant', 'Concierge', 'Room Service', 'Gym'],
        images: ImageService.getLocationBasedImages('NYC', 2, 3),
        coordinates: { latitude: 40.7648, longitude: -73.9748 },
      },
      {
        id: '4',
        name: 'Burj Al Arab Dubai',
        rating: 4.9,
        price: 800,
        currency: 'USD',
        address: 'Jumeirah Beach Road, Dubai, UAE',
        amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Concierge', 'Beach Access'],
        images: ImageService.getLocationBasedImages('DXB', 3, 3),
        coordinates: { latitude: 25.1412, longitude: 55.1853 },
      },
      {
        id: '5',
        name: 'Marina Bay Sands Singapore',
        rating: 4.7,
        price: 350,
        currency: 'USD',
        address: '10 Bayfront Ave, Singapore 018956',
        amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Concierge', 'Casino'],
        images: ImageService.getLocationBasedImages('SIN', 4, 3),
        coordinates: { latitude: 1.2833, longitude: 103.8607 },
      },
      {
        id: '6',
        name: 'Hotel de Crillon Paris',
        rating: 4.8,
        price: 650,
        currency: 'USD',
        address: '10 Place de la Concorde, 75008 Paris, France',
        amenities: ['Free WiFi', 'Spa', 'Restaurant', 'Concierge', 'Room Service', 'Gym'],
        images: ImageService.getLocationBasedImages('PAR', 5, 3),
        coordinates: { latitude: 48.8656, longitude: 2.3212 },
      },
      {
        id: '7',
        name: 'The Langham London',
        rating: 4.6,
        price: 420,
        currency: 'USD',
        address: '1C Portland Pl, London W1B 1JA, UK',
        amenities: ['Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Concierge', 'Gym'],
        images: ImageService.getLocationBasedImages('LON', 6, 3),
        coordinates: { latitude: 51.5186, longitude: -0.1438 },
      },
      {
        id: '8',
        name: 'Four Seasons New York',
        rating: 4.7,
        price: 580,
        currency: 'USD',
        address: '57 E 57th St, New York, NY 10022, USA',
        amenities: ['Free WiFi', 'Spa', 'Restaurant', 'Concierge', 'Room Service', 'Gym', 'Pool'],
        images: ImageService.getLocationBasedImages('NYC', 7, 3),
        coordinates: { latitude: 40.7614, longitude: -73.9776 },
      },
    ];
  }
}

export const hotelService = new HotelService();

