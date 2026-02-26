import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Hotel } from '../types/api';
import { savedItemsService } from '../services/SavedItemsService';
import { useAuth } from '../context/AuthProvider';

interface HotelCardProps {
  hotel: Hotel;
  onBook: (hotel: Hotel) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel, onBook }) => {
  const { profile } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.uid) {
      checkIfSaved();
    }
  }, [profile?.uid, hotel.id]);

  const checkIfSaved = async () => {
    if (!profile?.uid) return;
    try {
      const saved = await savedItemsService.isItemSaved(hotel.id, profile.uid);
      setIsSaved(saved);
    } catch (error) {
      console.error('Error checking if hotel is saved:', error);
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
        await savedItemsService.unsaveItem(hotel.id, profile.uid);
        setIsSaved(false);
        Alert.alert('Removed', 'Hotel removed from favorites');
      } else {
        await savedItemsService.saveItem(hotel, 'hotel', profile.uid);
        setIsSaved(true);
        Alert.alert('Saved', 'Hotel added to favorites');
      }
    } catch (error) {
      console.error('Error saving hotel:', error);
      Alert.alert('Error', 'Failed to save hotel');
    } finally {
      setSaving(false);
    }
  };

  const handleBook = () => {
    Alert.alert(
      'Book Hotel',
      `Book ${hotel.name} for $${hotel.price}/night?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => onBook(hotel) },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color="#FFD700" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color="#FFD700" />
      );
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: hotel.images[0] }}
          style={styles.hotelImage}
          resizeMode="cover"
        />
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>${hotel.price}</Text>
          <Text style={styles.priceSubtext}>/night</Text>
        </View>
        <View style={styles.ratingContainer}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
          </View>
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
          <Text style={styles.hotelName} numberOfLines={1}>
            {hotel.name}
          </Text>
          <View style={styles.starsContainer}>
            {renderStars(hotel.rating)}
          </View>
        </View>

        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color="#666" />
          <Text style={styles.address} numberOfLines={1}>
            {hotel.address}
          </Text>
        </View>

        <View style={styles.amenitiesContainer}>
          {hotel.amenities.slice(0, 3).map((amenity, index) => (
            <View key={index} style={styles.amenityTag}>
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {hotel.amenities.length > 3 && (
            <View style={styles.amenityTag}>
              <Text style={styles.amenityText}>+{hotel.amenities.length - 3}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>From</Text>
            <Text style={styles.priceValue}>
              ${hotel.price}
              <Text style={styles.currency}>/{hotel.currency}</Text>
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
    height: 200,
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  priceText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  ratingContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  amenityTag: {
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
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
  saveButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
