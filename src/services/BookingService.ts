// Booking Service for saving bookings to Firebase
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Hotel, Flight, Car } from '../types/api';

export interface Booking {
  id: string;
  type: 'hotel' | 'flight' | 'car';
  data: Hotel | Flight | Car;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookingDate: any;
  userId: string;
}

class BookingService {
  // Save hotel booking to Firebase
  async bookHotel(hotel: Hotel, userId: string, searchDates?: { checkIn?: string; checkOut?: string }): Promise<string> {
    try {
      console.log('=== BOOKING DEBUG INFO ===');
      console.log('Current user from auth:', auth.currentUser?.uid);
      console.log('User ID passed to function:', userId);
      console.log('Auth state:', auth.currentUser ? 'authenticated' : 'not authenticated');
      console.log('Hotel data:', hotel);
      
      // For now, we'll proceed with the booking using the userId directly
      // The Firestore rules will handle the authentication check
      console.log('Proceeding with booking using userId:', userId);
      
      const bookingData = {
        type: 'hotel',
        title: hotel.name,
        description: `${hotel.rating} stars • ${hotel.address}`,
        price: hotel.price,
        currency: hotel.currency,
        details: {
          id: hotel.id || 'unknown',
          name: hotel.name || 'Unknown Hotel',
          rating: hotel.rating || 0,
          address: hotel.address || 'Address not available',
          amenities: hotel.amenities || [],
          images: hotel.images || [],
          // Only include coordinates if they exist
          ...(hotel.coordinates && { coordinates: hotel.coordinates }),
          // Add check-in and check-out dates from search
          checkIn: searchDates?.checkIn || 'Not specified',
          checkOut: searchDates?.checkOut || 'Not specified',
        },
        searchFilters: {
          destination: hotel.address.split(',')[0], // Extract city from address
          checkIn: searchDates?.checkIn || new Date().toISOString().split('T')[0],
          checkOut: searchDates?.checkOut || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
          guests: 1,
        },
        status: 'confirmed',
        paymentStatus: 'unpaid',
        bookingDate: serverTimestamp(),
        userId: userId,
      };

      console.log('Booking data to save:', bookingData);
      console.log('Collection path: users/' + userId + '/bookings');
      
      const docRef = await addDoc(collection(db, 'users', userId, 'bookings'), bookingData);
      console.log('✅ Hotel booking saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving hotel booking:', error);
      console.error('Error code:', (error as any)?.code);
      console.error('Error message:', (error as any)?.message);
      throw error;
    }
  }

  // Save flight booking to Firebase
  async bookFlight(flight: Flight, userId: string): Promise<string> {
    try {
      const bookingData = {
        type: 'flight',
        title: `${flight.departure.city} to ${flight.arrival.city}`,
        description: `${flight.airline} • ${flight.duration} • ${flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}`,
        price: flight.price,
        currency: flight.currency,
        details: {
          id: flight.id || 'unknown',
          airline: flight.airline || 'Unknown Airline',
          flightNumber: flight.flightNumber || 'N/A',
          departure: flight.departure || {},
          arrival: flight.arrival || {},
          duration: flight.duration || 'N/A',
          stops: flight.stops || 0,
          class: flight.class || 'Economy',
          aircraft: flight.aircraft || 'Unknown',
        },
        searchFilters: {
          destination: flight.arrival.city,
          passengers: 1,
        },
        status: 'confirmed',
        paymentStatus: 'unpaid',
        bookingDate: serverTimestamp(),
        userId: userId,
      };

      const docRef = await addDoc(collection(db, 'users', userId, 'bookings'), bookingData);
      console.log('Flight booking saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving flight booking:', error);
      throw error;
    }
  }

  // Save car booking to Firebase
  async bookCar(car: Car, userId: string): Promise<string> {
    try {
      const bookingData = {
        type: 'car',
        title: `${car.company} ${car.model}`,
        description: `${car.category} • ${car.transmission} • ${car.seats} seats`,
        price: car.price,
        currency: car.currency,
        details: {
          id: car.id || 'unknown',
          company: car.company || 'Unknown Company',
          model: car.model || 'Unknown Model',
          category: car.category || 'Standard',
          transmission: car.transmission || 'Automatic',
          fuelType: car.fuelType || 'Gasoline',
          seats: car.seats || 5,
          images: car.images || [],
          features: car.features || [],
          pickupLocation: car.pickupLocation || 'Not specified',
          dropoffLocation: car.dropoffLocation || 'Not specified',
        },
        searchFilters: {
          destination: car.pickupLocation || 'Not specified',
        },
        status: 'confirmed',
        paymentStatus: 'unpaid',
        bookingDate: serverTimestamp(),
        userId: userId,
      };

      const docRef = await addDoc(collection(db, 'users', userId, 'bookings'), bookingData);
      console.log('Car booking saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving car booking:', error);
      throw error;
    }
  }
}

export const bookingService = new BookingService();
