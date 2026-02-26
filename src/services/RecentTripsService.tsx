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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface RecentTrip {
  id: string;
  type: 'flight' | 'hotel' | 'car';
  title: string;
  description: string;
  price: number;
  currency: string;
  details: any;
  searchFilters: any;
  bookingDate: string;
  paymentDate?: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  paymentStatus: 'paid';
}

export const RecentTripsService: React.FC = () => {
  const { profile } = useAuth();
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'hotel' | 'flight' | 'car'>('all');

  const loadRecentTrips = async () => {
    if (!profile?.uid) {
      setRecentTrips([]);
      setLoading(false);
      return;
    }

    try {
      console.log('📋 Loading recent trips (paid trips)...');
      
      // Get all paid bookings from Firestore
      const bookingsRef = collection(db, 'users', profile.uid, 'bookings');
      const q = query(
        bookingsRef,
        where('paymentStatus', '==', 'paid')
      );
      
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Found', querySnapshot.size, 'recent trips');
      
      const tripsData: RecentTrip[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tripsData.push({
          id: doc.id,
          ...data,
        } as RecentTrip);
      });
      
      // Sort by payment date manually (most recent first)
      tripsData.sort((a, b) => {
        const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        return dateB - dateA;
      });
      
      console.log('✅ Loaded recent trips:', tripsData);
      setRecentTrips(tripsData);
      
    } catch (error: any) {
      console.error('Error loading recent trips:', error);
      
      // Show demo data if there's a permission error
      if (error.code === 'missing-or-insufficient-permissions' || error.code === 'permission-denied') {
        console.log('Demo mode: showing mock recent trips due to permission error');
        setRecentTrips([
          {
            id: 'recent1',
            type: 'hotel',
            title: 'Marriott Hotel Dubai',
            description: '4.5 stars • Downtown Dubai',
            price: 250,
            currency: 'USD',
            details: {
              name: 'Marriott Hotel Dubai',
              rating: 4.5,
              address: 'Downtown Dubai, UAE',
              amenities: ['Free WiFi', 'Pool', 'Spa'],
            },
            searchFilters: {
              destination: 'Dubai',
              checkIn: '2024-01-15',
              checkOut: '2024-01-18',
              guests: 2,
            },
            bookingDate: new Date(Date.now() - 86400000 * 5).toISOString(),
            paymentDate: new Date(Date.now() - 86400000 * 4).toISOString(),
            status: 'confirmed',
            paymentStatus: 'paid',
          },
          {
            id: 'recent2',
            type: 'flight',
            title: 'Emirates Flight to Paris',
            description: 'EK 71 • 6h 45m • Direct',
            price: 450,
            currency: 'USD',
            details: {
              airline: 'Emirates',
              flightNumber: 'EK 71',
              departure: { city: 'Dubai' },
              arrival: { city: 'Paris' },
              duration: '6h 45m',
            },
            searchFilters: {
              destination: 'Paris',
              departureDate: '2024-01-10',
              returnDate: '2024-01-20',
              adults: 1,
            },
            bookingDate: new Date(Date.now() - 86400000 * 10).toISOString(),
            paymentDate: new Date(Date.now() - 86400000 * 9).toISOString(),
            status: 'confirmed',
            paymentStatus: 'paid',
          },
          {
            id: 'recent3',
            type: 'car',
            title: 'Hertz BMW X5',
            description: 'SUV • Automatic • 7 seats',
            price: 120,
            currency: 'USD',
            details: {
              company: 'Hertz',
              model: 'BMW X5',
              category: 'SUV',
              transmission: 'Automatic',
              seats: 7,
            },
            searchFilters: {
              destination: 'New York',
              pickupDate: '2024-01-05',
              dropoffDate: '2024-01-08',
            },
            bookingDate: new Date(Date.now() - 86400000 * 15).toISOString(),
            paymentDate: new Date(Date.now() - 86400000 * 14).toISOString(),
            status: 'confirmed',
            paymentStatus: 'paid',
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to load recent trips');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecentTrips();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRecentTrips();
  }, [profile?.uid]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hotel': return 'bed';
      case 'flight': return 'airplane';
      case 'car': return 'car';
      default: return 'receipt';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hotel': return '#3b82f6';
      case 'flight': return '#667eea';
      case 'car': return '#10b981';
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

  const filteredTrips = activeFilter === 'all' 
    ? recentTrips 
    : recentTrips.filter(trip => trip.type === activeFilter);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading recent trips...</Text>
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
        <Text style={styles.headerTitle}>Recent Trips</Text>
        <Text style={styles.headerSubtitle}>
          {filteredTrips.length} {filteredTrips.length === 1 ? 'trip' : 'trips'} completed
        </Text>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['all', 'hotel', 'flight', 'car'] as const).map((filter) => (
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
                  filter === 'flight' ? 'airplane' : 'car'
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

      {filteredTrips.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={60} color="#ccc" />
          <Text style={styles.emptyStateTitle}>
            {activeFilter === 'all' ? 'No recent trips yet' : `No ${activeFilter} trips completed`}
          </Text>
          <Text style={styles.emptyStateText}>
            Your completed trips will appear here after payment
          </Text>
        </View>
      ) : (
        <View style={styles.tripsContainer}>
          {filteredTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripIcon}>
                <Ionicons
                  name={getTypeIcon(trip.type)}
                  size={32}
                  color={getTypeColor(trip.type)}
                />
              </View>
              
              <View style={styles.tripContent}>
                <View style={styles.tripHeader}>
                  <Text style={styles.tripTitle}>{trip.title}</Text>
                  <View style={styles.paidBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.paidText}>Paid</Text>
                  </View>
                </View>
                
                <Text style={styles.tripDescription}>{trip.description}</Text>
                
                <View style={styles.tripMeta}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>
                      {trip.currency} {trip.price}
                    </Text>
                    <Text style={styles.priceLabel}>Total Paid</Text>
                  </View>
                  
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateLabel}>Paid on</Text>
                    <Text style={styles.dateText}>
                      {trip.paymentDate ? formatDate(trip.paymentDate) : 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.statusContainer}>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </Text>
                  </View>
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
  tripsContainer: {
    padding: 20,
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tripIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tripContent: {
    flex: 1,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  paidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 4,
  },
  tripDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    backgroundColor: '#f0f2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
  },
});
