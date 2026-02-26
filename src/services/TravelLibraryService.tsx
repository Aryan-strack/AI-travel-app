import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { collection, addDoc, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { savedItemsService, SavedItem } from '../services/SavedItemsService';
import { Hotel, Flight, Car } from '../types/api';

interface LibraryItem {
  id: string;
  type: 'hotel' | 'flight' | 'car' | 'destination' | 'restaurant' | 'activity';
  title: string;
  description: string;
  location?: string;
  rating?: number;
  price?: number;
  currency?: string;
  image?: string;
  savedDate: string;
  tags?: string[];
  data?: Hotel | Flight | Car;
}

export const TravelLibraryService: React.FC = () => {
  const { profile } = useAuth();
  const [savedItems, setSavedItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'hotel' | 'flight' | 'car' | 'destination' | 'restaurant' | 'activity'>('all');

  const loadSavedItems = async () => {
    if (!profile?.uid) {
      setSavedItems([]);
      setLoading(false);
      return;
    }

    try {
      console.log('📚 Loading saved items from service...');
      const items = await savedItemsService.getSavedItems(profile.uid);
      
      // Transform SavedItem to LibraryItem
      const libraryItems: LibraryItem[] = items.map(item => {
        const hotel = item.type === 'hotel' ? item.data as Hotel : null;
        const flight = item.type === 'flight' ? item.data as Flight : null;
        const car = item.type === 'car' ? item.data as Car : null;
        
        return {
          id: item.id,
          type: item.type,
          title: hotel ? hotel.name : 
                 flight ? `${flight.airline} ${flight.flightNumber}` :
                 car ? `${car.company} ${car.model}` : 'Saved Item',
          description: hotel ? `${hotel.rating} stars • ${hotel.address}` :
                    flight ? `${flight.departure.city} → ${flight.arrival.city}` :
                    car ? `${car.category} • ${car.transmission}` : 'Description',
          location: hotel ? hotel.address :
                   flight ? `${flight.departure.city} → ${flight.arrival.city}` :
                   car ? car.location : 'Location',
          rating: hotel ? hotel.rating : undefined,
          price: hotel ? hotel.price : flight ? flight.price : car ? car.price : undefined,
          currency: hotel ? hotel.currency : flight ? flight.currency : car ? car.currency : undefined,
          savedDate: item.savedDate?.seconds ? new Date(item.savedDate.seconds * 1000).toISOString() : new Date().toISOString(),
          tags: hotel ? (hotel.amenities && hotel.amenities.length > 0 ? hotel.amenities.slice(0, 3) : ['hotel', 'accommodation']) : 
                flight ? ['flight', 'travel'] :
                car ? ['car', 'rental'] : [],
          data: item.data,
        };
      });
      
      console.log('✅ Loaded', libraryItems.length, 'saved items');
      setSavedItems(libraryItems);
    } catch (error: any) {
      console.error('Error loading saved items:', error);
      // In demo mode or permission error, show some mock saved items
      if (error.code === 'missing-or-insufficient-permissions' || error.code === 'permission-denied') {
        console.log('Demo mode: showing mock saved items due to permission error');
      }
      setSavedItems([
        {
          id: 'demo1',
          type: 'destination',
          title: 'Santorini, Greece',
          description: 'Beautiful Greek island with stunning sunsets',
          location: 'Greece',
          rating: 4.8,
          image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400',
          savedDate: new Date().toISOString(),
          tags: ['beach', 'romantic', 'sunset'],
        },
        {
          id: 'demo2',
          type: 'hotel',
          title: 'The Ritz Paris',
          description: '5-star luxury hotel in central Paris',
          location: 'Paris, France',
          rating: 4.9,
          price: 450,
          currency: 'USD',
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
          savedDate: new Date(Date.now() - 86400000).toISOString(),
          tags: ['luxury', 'central', 'spa'],
        },
        {
          id: 'demo3',
          type: 'restaurant',
          title: 'Osteria Francescana',
          description: '3-Michelin star restaurant by Massimo Bottura',
          location: 'Modena, Italy',
          rating: 4.9,
          price: 300,
          currency: 'EUR',
          image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
          savedDate: new Date(Date.now() - 172800000).toISOString(),
          tags: ['fine-dining', 'michelin', 'italian'],
        },
        {
          id: 'demo4',
          type: 'activity',
          title: 'Hot Air Balloon Ride',
          description: 'Sunrise hot air balloon over Cappadocia',
          location: 'Cappadocia, Turkey',
          rating: 4.7,
          price: 150,
          currency: 'USD',
          image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          savedDate: new Date(Date.now() - 259200000).toISOString(),
          tags: ['adventure', 'sunrise', 'unique'],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (profile?.uid) {
                await deleteDoc(doc(db, 'users', profile.uid, 'savedItems', itemId));
              }
              setSavedItems(prev => prev.filter(item => item.id !== itemId));
              Alert.alert('Success', 'Item removed from library');
            } catch (error: any) {
              console.error('Error removing item:', error);
              if (error.code === 'missing-or-insufficient-permissions' || error.code === 'permission-denied') {
                // Demo mode - just remove from local state
                setSavedItems(prev => prev.filter(item => item.id !== itemId));
                Alert.alert('Success', 'Item removed from library (Demo Mode)');
              } else {
                Alert.alert('Error', 'Failed to remove item');
              }
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedItems();
    setRefreshing(false);
  };

  useEffect(() => {
    loadSavedItems();
  }, [profile?.uid]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return 'bed';
      case 'flight': return 'airplane';
      case 'car': return 'car';
      case 'destination': return 'location';
      case 'restaurant': return 'restaurant';
      case 'activity': return 'bicycle';
      default: return 'bookmark';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return '#3b82f6';
      case 'flight': return '#667eea';
      case 'car': return '#10b981';
      case 'destination': return '#10b981';
      case 'restaurant': return '#f59e0b';
      case 'activity': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredItems = activeFilter === 'all' 
    ? savedItems 
    : savedItems.filter(item => item.type === activeFilter);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your library...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Travel Library</Text>
        <Text style={styles.headerSubtitle}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} saved
        </Text>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'hotel', 'flight', 'car', 'destination', 'restaurant', 'activity'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Ionicons
                name={
                  filter === 'all' ? 'grid' :
                  filter === 'hotel' ? 'bed' :
                  filter === 'flight' ? 'airplane' :
                  filter === 'car' ? 'car' :
                  filter === 'destination' ? 'location' :
                  filter === 'restaurant' ? 'restaurant' : 'bicycle'
                }
                size={16}
                color={activeFilter === filter ? '#667eea' : '#666'}
              />
              <Text style={[
                styles.filterText,
                activeFilter === filter && styles.activeFilterText
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark" size={60} color="#ccc" />
          <Text style={styles.emptyStateTitle}>
            {activeFilter === 'all' ? 'No saved items yet' : `No ${activeFilter}s saved`}
          </Text>
          <Text style={styles.emptyStateText}>
            Start saving destinations, hotels, restaurants, and activities you love!
          </Text>
        </View>
      ) : (
        <View style={styles.itemsContainer}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImage}>
                <Ionicons
                  name={getTypeIcon(item.type)}
                  size={32}
                  color={getTypeColor(item.type)}
                />
              </View>
              
              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.id)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemLocation}>{item.location}</Text>
                
                <View style={styles.itemMeta}>
                  {item.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  )}
                  
                  {item.price && (
                    <Text style={styles.priceText}>
                      {item.currency} {item.price}
                    </Text>
                  )}
                  
                  <Text style={styles.dateText}>
                    Saved {formatDate(item.savedDate)}
                  </Text>
                </View>
                
                <View style={styles.tagsContainer}>
                  {item.tags && item.tags.length > 0 && item.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  filterContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 12,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#f0f2ff',
  },
  filterText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#667eea',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  itemsContainer: {
    padding: 20,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: {
    width: 60,
    height: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  removeButton: {
    padding: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginRight: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#667eea',
    fontWeight: '600',
  },
});
