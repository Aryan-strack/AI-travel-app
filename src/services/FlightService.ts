// Flight Service for Amadeus API integration
import { Flight, FlightSearchParams } from '../types/api';

const AMADEUS_API_KEY = 'vJ7GWJX57u0MAMFbVL6XBQegcFqyeO4W';
const AMADEUS_API_SECRET = 'NrYrHCig2SOAEtjB';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

class FlightService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Get access token for Amadeus API
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      console.log('Requesting Amadeus access token for flights...');
      
      const body = `grant_type=client_credentials&client_id=${AMADEUS_API_KEY}&client_secret=${AMADEUS_API_SECRET}`;
      
      const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      console.log('Flight token response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flight token request failed:', response.status, errorText);
        throw new Error(`Token request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Flight token response data:', data);
      
      if (!data.access_token) {
        throw new Error('No access token in response');
      }
      
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      console.log('Flight access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      console.error('Error getting flight access token:', error);
      throw error;
    }
  }

  // Search flights using Amadeus API
  async searchFlights(params: FlightSearchParams): Promise<Flight[]> {
    try {
      console.log('Starting flight search with params:', params);
      
      const token = await this.getAccessToken();
      console.log('Got flight access token, proceeding with API calls...');
      
      const queryParams = new URLSearchParams({
        originLocationCode: params.origin,
        destinationLocationCode: params.destination,
        departureDate: params.departureDate,
        adults: params.adults.toString(),
        currencyCode: params.currency || 'USD',
        max: '10',
      });

      if (params.returnDate) {
        queryParams.append('returnDate', params.returnDate);
      }
      if (params.children) {
        queryParams.append('children', params.children.toString());
      }
      if (params.infants) {
        queryParams.append('infants', params.infants.toString());
      }
      if (params.travelClass) {
        queryParams.append('travelClass', params.travelClass);
      }

      const response = await fetch(
        `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Flight search API error:', response.status, errorText);
        console.log('Falling back to mock flights due to API error');
        return this.getMockFlights();
      }

      const data = await response.json();
      console.log('Flight search response:', data);

      return this.transformFlightData(data);
    } catch (error) {
      console.error('Flight search error:', error);
      console.log('Falling back to mock flights due to general error');
      return this.getMockFlights();
    }
  }

  // Transform flight data
  private transformFlightData(apiData: any): Flight[] {
    if (!apiData.data || !Array.isArray(apiData.data)) {
      console.log('No flight data found, using mock data');
      return this.getMockFlights();
    }

    return apiData.data.slice(0, 10).map((offer: any, index: number) => {
      const itinerary = offer.itineraries[0];
      const segments = itinerary.segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];
      
      return {
        id: offer.id || `flight-${index}`,
        airline: firstSegment.carrierCode || 'Unknown',
        flightNumber: firstSegment.number || 'N/A',
        departure: {
          airport: firstSegment.departure.iataCode,
          city: firstSegment.departure.iataCode,
          time: firstSegment.departure.at.split('T')[1].substring(0, 5),
          date: firstSegment.departure.at.split('T')[0],
        },
        arrival: {
          airport: lastSegment.arrival.iataCode,
          city: lastSegment.arrival.iataCode,
          time: lastSegment.arrival.at.split('T')[1].substring(0, 5),
          date: lastSegment.arrival.at.split('T')[0],
        },
        duration: itinerary.duration || 'N/A',
        stops: segments.length - 1,
        price: Math.floor(parseFloat(offer.price.total)),
        currency: offer.price.currency || 'USD',
        class: offer.travelerPricings[0].fareDetailsBySegment[0].cabin || 'Economy',
        aircraft: firstSegment.aircraft.code || 'Unknown',
      };
    });
  }

  // Mock flights as fallback
  private getMockFlights(): Flight[] {
    return [
      {
        id: '1',
        airline: 'Emirates',
        flightNumber: 'EK201',
        departure: {
          airport: 'DXB',
          city: 'Dubai',
          time: '08:30',
          date: '2024-01-15',
        },
        arrival: {
          airport: 'LHR',
          city: 'London',
          time: '13:45',
          date: '2024-01-15',
        },
        duration: 'PT7H15M',
        stops: 0,
        price: 650,
        currency: 'USD',
        class: 'Economy',
        aircraft: 'Boeing 777',
      },
      {
        id: '2',
        airline: 'Lufthansa',
        flightNumber: 'LH441',
        departure: {
          airport: 'FRA',
          city: 'Frankfurt',
          time: '14:20',
          date: '2024-01-15',
        },
        arrival: {
          airport: 'JFK',
          city: 'New York',
          time: '17:30',
          date: '2024-01-15',
        },
        duration: 'PT8H10M',
        stops: 0,
        price: 720,
        currency: 'USD',
        class: 'Economy',
        aircraft: 'Airbus A380',
      },
      {
        id: '3',
        airline: 'Singapore Airlines',
        flightNumber: 'SQ321',
        departure: {
          airport: 'SIN',
          city: 'Singapore',
          time: '23:55',
          date: '2024-01-15',
        },
        arrival: {
          airport: 'LHR',
          city: 'London',
          time: '06:00',
          date: '2024-01-16',
        },
        duration: 'PT13H5M',
        stops: 0,
        price: 890,
        currency: 'USD',
        class: 'Economy',
        aircraft: 'Airbus A350',
      },
    ];
  }
}

export const flightService = new FlightService();

