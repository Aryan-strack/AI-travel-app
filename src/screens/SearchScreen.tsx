import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthProvider';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { SearchHeader } from '../components/SearchHeader';
import { SearchTabs } from '../components/SearchTabs';
import { SearchForm, SearchFilters } from '../components/SearchForm';
import { SearchResults } from '../components/SearchResults';
import { travelAPI, Hotel, Flight, Car, HotelSearchParams, FlightSearchParams, CarSearchParams } from '../services/TravelAPI';
import { bookingService } from '../services/BookingService';
import { TravelSuggestion } from '../services/AITravelChatbot';

export const SearchScreen: React.FC = () => {
  const { profile } = useAuth();
  const route = useRoute();
  const routeParams = route.params as { 
    destination?: string; 
    type?: 'hotels' | 'flights' | 'cars'; 
    suggestedHotel?: any;
  } | undefined;
  
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'cars'>('hotels');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSearchFilters, setCurrentSearchFilters] = useState<SearchFilters | null>(null);
  const [suggestedHotel, setSuggestedHotel] = useState<Hotel | null>(null);
  const [clearForm, setClearForm] = useState(false);

  // Clear form when component mounts (when navigating to search page)
  useEffect(() => {
    console.log('🧹 Clearing form on navigation to search page');
    setClearForm(true);
    setTimeout(() => setClearForm(false), 100);
  }, []);

  // Handle route parameters when component mounts
  useEffect(() => {
    if (routeParams) {
      // Set the active tab if specified
      if (routeParams.type) {
        setActiveTab(routeParams.type);
      }
      
      // Handle suggested hotel from chatbot
      if (routeParams.suggestedHotel) {
        console.log('🎯 Processing suggested hotel from route params:', routeParams.suggestedHotel);
        const hotel = convertSuggestionToHotel(routeParams.suggestedHotel);
        console.log('🏨 Converted hotel object:', hotel);
        setSuggestedHotel(hotel);
        setHotels([hotel]); // Show the suggested hotel in results
        console.log('✅ Suggested hotel set in state');
      }
      
      // Handle destination parameter
      if (routeParams.destination) {
        // You could auto-fill the search form here if needed
        console.log('Destination from route params:', routeParams.destination);
      }
    }
  }, [routeParams]);

  // Refresh screen when user navigates back to it
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Search screen focused - refreshing page');
      
      // Only clear search results if there's no suggested hotel from route params
      if (!routeParams?.suggestedHotel) {
        setHotels([]);
        setFlights([]);
        setCars([]);
        setSuggestedHotel(null);
      } else {
        // If there's a suggested hotel, only clear flights and cars
        setFlights([]);
        setCars([]);
        console.log('🎯 Preserving suggested hotel from route params');
      }
      
      setCurrentSearchFilters(null);
      
      // Clear the search form
      setClearForm(true);
      setTimeout(() => setClearForm(false), 100);
      
      console.log('✅ Search screen refreshed');
    }, [routeParams?.suggestedHotel])
  );

  // Convert TravelSuggestion to Hotel object
  const convertSuggestionToHotel = (suggestion: any): Hotel => {
    // Extract price from suggestion.price string (e.g., "$200-400/night")
    const priceMatch = suggestion.price?.match(/\$(\d+)/);
    const basePrice = priceMatch ? parseInt(priceMatch[1]) : 200;
    
    // Get location-specific images based on the location
    const getLocationImages = (location: string) => {
      const locationLower = location.toLowerCase();
      if (locationLower.includes('dubai')) {
        return [
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
        ];
      } else if (locationLower.includes('london')) {
        return [
          'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
        ];
      } else if (locationLower.includes('paris')) {
        return [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
        ];
      } else if (locationLower.includes('tokyo')) {
        return [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
        ];
      } else {
        return [
          'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
          'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
        ];
      }
    };
    
    return {
      id: `suggested-${suggestion.title.toLowerCase().replace(/\s+/g, '-')}`,
      name: suggestion.title,
      rating: suggestion.rating || 4.5,
      address: suggestion.location || 'Location not specified',
      price: basePrice,
      currency: 'USD',
      amenities: [
        'Free WiFi',
        'Air Conditioning',
        'Room Service',
        'Concierge',
        'Restaurant',
        'Fitness Center',
        'Spa',
        'Business Center'
      ],
      images: getLocationImages(suggestion.location || ''),
      coordinates: {
        latitude: 0,
        longitude: 0
      }
    };
  };

  const onRefresh = async () => {
    console.log('🔄 Refresh triggered');
    setRefreshing(true);
    // Clear the form fields
    setClearForm(true);
    setTimeout(() => setClearForm(false), 100); // Reset the clear flag
    
    try {
      // Clear all results and search filters
      setHotels([]);
      setFlights([]);
      setCars([]);
      setCurrentSearchFilters(null);
      setSuggestedHotel(null);
      
      console.log('🔄 Form cleared and results reset');
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      console.log('🔄 Refresh completed, setting refreshing to false');
      setRefreshing(false);
    }
  };

  const handleSearch = async (filters: SearchFilters, isRefresh: boolean = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    // Clear suggested hotel when performing a new search
    setSuggestedHotel(null);
    // Store the current search filters for use in booking
    setCurrentSearchFilters(filters);
    try {
      console.log('🔍 Starting AI-powered search for:', activeTab);
      console.log('Search filters:', filters);
      console.log('User profile:', profile);

      if (activeTab === 'hotels') {
        // Simplified search params for AI - no need for city codes
        const searchParams: HotelSearchParams = {
          cityCode: filters.destination || 'NYC',
          checkInDate: filters.checkIn,
          checkOutDate: filters.checkOut,
          adults: filters.guests || 2,
          roomQuantity: 1,
          currency: 'USD',
        };

        console.log('🏨 AI Hotel search params:', searchParams);
        const results = await travelAPI.searchHotels(searchParams, profile);
        setHotels(results);
        console.log('✅ AI Hotel search completed:', results.length, 'results');
      } else if (activeTab === 'flights') {
        // Simplified search params for AI
        const searchParams: FlightSearchParams = {
          origin: filters.origin || 'New York',
          destination: filters.destination,
          departureDate: filters.checkIn,
          returnDate: filters.checkOut,
          adults: filters.guests,
          currency: 'USD',
        };

        console.log('✈️ AI Flight search params:', searchParams);
        const results = await travelAPI.searchFlights(searchParams, profile);
        setFlights(results);
        console.log('✅ AI Flight search completed:', results.length, 'results');
      } else if (activeTab === 'cars') {
        // Simplified search params for AI
        const searchParams: CarSearchParams = {
          pickUpLocation: filters.destination || 'New York',
          dropOffLocation: filters.destination || 'New York',
          pickUpDate: filters.checkIn,
          dropOffDate: filters.checkOut,
          driverAge: 25,
          currency: 'USD',
        };

        console.log('🚗 AI Car search params:', searchParams);
        const results = await travelAPI.searchCars(searchParams, profile);
        setCars(results);
        console.log('✅ AI Car search completed:', results.length, 'results');
      }
    } catch (error) {
      console.error('❌ AI Search error:', error);
      Alert.alert('Search Error', `Failed to search ${activeTab}. Please try again.`);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  const handleBookHotel = async (hotel: Hotel) => {
    if (!profile?.uid) {
      Alert.alert('Error', 'Please log in to make a booking.');
      return;
    }

    try {
      console.log('🏨 Booking hotel:', hotel.name);
      
      // Provide default search filters if not available (for suggested hotels)
      const defaultSearchFilters = {
        destination: hotel.address.split(',')[0] || 'Not specified',
        checkIn: currentSearchFilters?.checkIn || new Date().toISOString().split('T')[0],
        checkOut: currentSearchFilters?.checkOut || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        guests: currentSearchFilters?.guests || 1,
        budget: currentSearchFilters?.budget || hotel.price,
      };
      
      // Use the BookingService for real booking
      const searchDates = {
        checkIn: defaultSearchFilters.checkIn,
        checkOut: defaultSearchFilters.checkOut,
      };
      
      const bookingId = await bookingService.bookHotel(hotel, profile.uid, searchDates);
      console.log('✅ Hotel booking successful:', bookingId);
      
      // Show different messages based on whether this was a suggested hotel
      const isSuggestedHotel = suggestedHotel && suggestedHotel.id === hotel.id;
      const message = isSuggestedHotel 
        ? `Hotel booked successfully!\n\n📅 Default dates applied:\n• Check-in: ${defaultSearchFilters.checkIn}\n• Check-out: ${defaultSearchFilters.checkOut}\n\nBooking ID: ${bookingId}`
        : `Hotel booked successfully! Booking ID: ${bookingId}`;
      
      Alert.alert('Success', message);
      
    } catch (error: any) {
      console.error('Error booking hotel:', error);
      Alert.alert('Error', `Failed to book hotel: ${error.message}`);
    }
  };

  const handleBookFlight = async (flight: Flight) => {
    if (!profile?.uid) {
      Alert.alert('Error', 'Please log in to make a booking.');
      return;
    }

    try {
      const bookingId = await bookingService.bookFlight(flight, profile.uid);
      console.log('Flight booking successful:', bookingId);
      
      Alert.alert(
        'Flight Booked!',
        `Your flight ${flight.airline} ${flight.flightNumber} has been confirmed.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Flight booking error:', error);
      Alert.alert('Booking Error', 'Failed to complete booking. Please try again.');
    }
  };

  const handleBookCar = async (car: Car) => {
    if (!profile?.uid) {
      Alert.alert('Error', 'Please log in to make a booking.');
      return;
    }

    try {
      const bookingId = await bookingService.bookCar(car, profile.uid);
      console.log('Car booking successful:', bookingId);
      
      Alert.alert(
        'Car Booked!',
        `Your ${car.model} from ${car.company} has been confirmed.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Car booking error:', error);
      Alert.alert('Booking Error', 'Failed to complete booking. Please try again.');
    }
  };

  // Note: City code mapping removed - AI search doesn't need it!
  // The AI understands natural language destinations directly

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SearchHeader userName={profile?.userName || undefined} />
        <SearchTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <SearchForm onSearch={handleSearch} loading={loading} searchType={activeTab} clearForm={clearForm} />
        
        {activeTab === 'hotels' && (
          <View>
            {suggestedHotel && (
              <View style={styles.suggestionBanner}>
                <Text style={styles.suggestionBannerText}>
                  🎯 AI Suggested Hotel - Based on your preferences
                </Text>
              </View>
            )}
            <SearchResults 
              hotels={hotels}
              loading={loading}
              onBookHotel={handleBookHotel}
            />
          </View>
        )}
        
        {activeTab === 'flights' && (
          <SearchResults 
            flights={flights}
            loading={loading}
            onBookFlight={handleBookFlight}
          />
        )}
        
        {activeTab === 'cars' && (
          <SearchResults 
            cars={cars}
            loading={loading}
            onBookCar={handleBookCar}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  comingSoonCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  comingSoonIcon: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginHorizontal: 2,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  suggestionBanner: {
    backgroundColor: '#f0f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
  },
  suggestionBannerText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
});