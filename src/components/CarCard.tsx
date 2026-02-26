import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Car } from '../types/api';
import { savedItemsService } from '../services/SavedItemsService';
import { useAuth } from '../context/AuthProvider';

interface CarCardProps {
  car: Car;
  onBook: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onBook }) => {
  const { profile } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.uid) {
      checkIfSaved();
    }
  }, [profile?.uid, car.id]);

  const checkIfSaved = async () => {
    if (!profile?.uid) return;
    try {
      const saved = await savedItemsService.isItemSaved(car.id, profile.uid);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking if car is saved:', error);
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
        await savedItemsService.unsaveItem(car.id, profile.uid);
        setIsSaved(false);
        Alert.alert('Removed', 'Car removed from favorites');
      } else {
        await savedItemsService.saveItem(car, 'car', profile.uid);
        setIsSaved(true);
        Alert.alert('Saved', 'Car added to favorites');
      }
    } catch (error) {
      console.error('Error saving car:', error);
      Alert.alert('Error', 'Failed to save car');
    } finally {
      setSaving(false);
    }
  };

  const handleBook = () => {
    Alert.alert(
      'Book Car',
      `Book ${car.company} ${car.model} for ${car.currency}${car.price}/day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => onBook(car) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <View style={styles.carImagePlaceholder}>
          <Ionicons name="car" size={40} color="#667eea" />
        </View>
        
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons 
            name={isSaved ? "heart" : "heart-outline"} 
            size={20} 
            color={isSaved ? "#ff4757" : "white"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.carModel}>{car.model}</Text>
          <Text style={styles.carCompany}>{car.company}</Text>
        </View>

        <Text style={styles.carCategory}>{car.category}</Text>

        <View style={styles.carDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={16} color="#666" />
            <Text style={styles.detailText}>{car.seats} seats</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="settings" size={16} color="#666" />
            <Text style={styles.detailText}>{car.transmission}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="flash" size={16} color="#666" />
            <Text style={styles.detailText}>{car.fuelType}</Text>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          {car.features.slice(0, 3).map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {car.features.length > 3 && (
            <View style={styles.featureTag}>
              <Text style={styles.featureText}>+{car.features.length - 3}</Text>
            </View>
          )}
        </View>

        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.locationText}>{car.location}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.priceValue}>
              {car.currency} {car.price}
              <Text style={styles.currency}>/day</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  carImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  carModel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  carCompany: {
    fontSize: 14,
    color: '#666',
  },
  carCategory: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
    marginBottom: 12,
  },
  carDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
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
