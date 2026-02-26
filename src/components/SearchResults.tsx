import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HotelCard } from './HotelCard';
import { FlightCard } from './FlightCard';
import { CarCard } from './CarCard';
import { Hotel, Flight, Car } from '../types/api';

interface SearchResultsProps {
  hotels?: Hotel[];
  flights?: Flight[];
  cars?: Car[];
  loading: boolean;
  onBookHotel?: (hotel: Hotel) => void;
  onBookFlight?: (flight: Flight) => void;
  onBookCar?: (car: Car) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  hotels, 
  flights,
  cars,
  loading, 
  onBookHotel,
  onBookFlight,
  onBookCar
}) => {
  const getResultType = () => {
    if (hotels) return 'hotels';
    if (flights) return 'flights';
    if (cars) return 'cars';
    return 'hotels';
  };

  const getResultCount = () => {
    if (hotels) return hotels.length;
    if (flights) return flights.length;
    if (cars) return cars.length;
    return 0;
  };

  const getLoadingText = () => {
    const type = getResultType();
    return `Searching for the best ${type}...`;
  };

  const getEmptyTitle = () => {
    const type = getResultType();
    return `No ${type} found`;
  };

  const getEmptySubtitle = () => {
    const type = getResultType();
    return `Try adjusting your search criteria or ${type === 'hotels' ? 'destination' : type === 'flights' ? 'route' : 'location'}`;
  };

  const getTitle = () => {
    const count = getResultCount();
    const type = getResultType();
    return `${count} ${type} found`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>{getLoadingText()}</Text>
      </View>
    );
  }

  const results = hotels || flights || cars || [];
  if (results.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={60} color="#ccc" />
        <Text style={styles.emptyTitle}>{getEmptyTitle()}</Text>
        <Text style={styles.emptySubtitle}>
          {getEmptySubtitle()}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {getTitle()}
        </Text>
        <View style={styles.filterButton}>
          <Ionicons name="filter" size={16} color="#667eea" />
          <Text style={styles.filterText}>Filter</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {hotels && hotels.map((hotel) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            onBook={onBookHotel!}
          />
        ))}
        
        {flights && flights.map((flight) => (
          <FlightCard
            key={flight.id}
            flight={flight}
            onBook={onBookFlight!}
          />
        ))}
        
        {cars && cars.map((car) => (
          <CarCard
            key={car.id}
            car={car}
            onBook={onBookCar!}
          />
        ))}
      </ScrollView>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginLeft: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Card styles
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Flight card styles
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  airlineInfo: {
    flex: 1,
  },
  airlineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  flightNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
  },
  currency: {
    fontSize: 12,
    color: '#666',
  },
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  airport: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  city: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  flightPath: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  pathLine: {
    height: 2,
    backgroundColor: '#667eea',
    width: '100%',
    marginBottom: 8,
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  stops: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aircraft: {
    fontSize: 12,
    color: '#666',
  },
  bookButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});