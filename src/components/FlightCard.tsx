import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Flight } from '../types/api';
import { savedItemsService } from '../services/SavedItemsService';
import { useAuth } from '../context/AuthProvider';

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight) => void;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, onBook }) => {
  const { profile } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.uid) {
      checkIfSaved();
    }
  }, [profile?.uid, flight.id]);

  const checkIfSaved = async () => {
    if (!profile?.uid) return;
    try {
      const saved = await savedItemsService.isItemSaved(flight.id, profile.uid);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking if flight is saved:', error);
    }
  };

  const handleSave = async () => {
    if (!profile?.uid) {
      Alert.alert('Please Login', 'You need to be logged in to save items');
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        await savedItemsService.unsaveItem(flight.id, profile.uid);
        setIsSaved(false);
        Alert.alert('Removed', 'Flight removed from favorites');
      } else {
        await savedItemsService.saveItem(flight, 'flight', profile.uid);
        setIsSaved(true);
        Alert.alert('Saved', 'Flight added to favorites');
      }
    } catch (error) {
      console.error('Error saving flight:', error);
      Alert.alert('Error', 'Failed to save flight');
    } finally {
      setSaving(false);
    }
  };

  const handleBook = () => {
    Alert.alert(
      'Book Flight',
      `Book ${flight.airline} flight for $${flight.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => onBook(flight) },
      ]
    );
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // Remove seconds if present
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.airlineInfo}>
          <Text style={styles.airlineName}>{flight.airline}</Text>
          <Text style={styles.flightNumber}>{flight.flightNumber}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons 
            name={isSaved ? "heart" : "heart-outline"} 
            size={20} 
            color={isSaved ? "#ff4757" : "#667eea"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.airportInfo}>
          <Text style={styles.airportCode}>{flight.departure.airport}</Text>
          <Text style={styles.cityName}>{flight.departure.city}</Text>
          <Text style={styles.timeText}>{formatTime(flight.departure.time)}</Text>
        </View>

        <View style={styles.flightPath}>
          <View style={styles.durationContainer}>
            <Text style={styles.durationText}>{flight.duration}</Text>
            <View style={styles.flightLine} />
            <Text style={styles.stopsText}>
              {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        <View style={styles.airportInfo}>
          <Text style={styles.airportCode}>{flight.arrival.airport}</Text>
          <Text style={styles.cityName}>{flight.arrival.city}</Text>
          <Text style={styles.timeText}>{formatTime(flight.arrival.time)}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceValue}>
            ${flight.price}
            <Text style={styles.currency}>/{flight.currency}</Text>
          </Text>
        </View>

        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bookButtonGradient}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
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
    fontWeight: 'bold',
    color: '#333',
  },
  flightNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  airportInfo: {
    flex: 1,
    alignItems: 'center',
  },
  airportCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cityName: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontWeight: '500',
  },
  flightPath: {
    flex: 2,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  durationContainer: {
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  flightLine: {
    width: 60,
    height: 2,
    backgroundColor: '#667eea',
    marginBottom: 4,
  },
  stopsText: {
    fontSize: 10,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  currency: {
    fontSize: 14,
    color: '#666',
  },
  bookButton: {
    marginLeft: 12,
  },
  bookButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
