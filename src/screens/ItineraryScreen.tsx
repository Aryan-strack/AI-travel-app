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
import { collection, query, where, orderBy, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNavigation } from '@react-navigation/native';
import { balanceService } from '../services/BalanceService';

interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'car';
  title: string;
  description: string;
  price: number;
  currency: string;
  details: any;
  searchFilters: any;
  bookingDate: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
}

export const ItineraryScreen: React.FC = () => {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = async () => {
    if (!profile?.uid) {
      console.log('❌ No profile UID available');
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Loading unpaid trips for user:', profile.uid);
      
      const bookingsRef = collection(db, 'users', profile.uid, 'bookings');
      console.log('📁 Bookings collection path:', `users/${profile.uid}/bookings`);
      
      // Get all bookings and filter out paid ones (paid trips will be in Recent Trips)
      const q = query(bookingsRef, orderBy('bookingDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Found', querySnapshot.size, 'total bookings');
      
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        console.log('📄 Booking document:', doc.id, doc.data());
        const bookingData = doc.data();
        const paymentStatus = bookingData.paymentStatus || 'unpaid'; // Default to unpaid if not set
        
        // Only include unpaid bookings
        if (paymentStatus !== 'paid') {
          bookingsData.push({
            id: doc.id,
            ...bookingData,
            paymentStatus: paymentStatus,
          } as Booking);
        }
      });
      
      console.log('✅ Loaded unpaid trips:', bookingsData);
      setBookings(bookingsData);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      console.log('No unpaid trips found or permission error');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const isPaid = booking?.paymentStatus === 'paid';
    const refundAmount = isPaid ? booking.price : 0;
    
    Alert.alert(
      'Cancel Booking',
      isPaid 
        ? `Are you sure you want to cancel this booking? You will receive a refund of ${booking.currency} ${booking.price}.`
        : 'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              if (profile?.uid) {
                // Refund money if booking was paid
                if (isPaid && booking) {
                  await balanceService.addMoney(
                    profile.uid,
                    refundAmount,
                    booking.currency,
                    `Refund for cancelled ${booking.title}`
                  );
                }
                
                // Delete the booking
                await deleteDoc(doc(db, 'users', profile.uid, 'bookings', bookingId));
              }
              
              setBookings(prev => prev.filter(booking => booking.id !== bookingId));
              
              Alert.alert(
                'Success', 
                isPaid 
                  ? `Booking cancelled successfully! ${booking.currency} ${refundAmount} has been refunded to your wallet.`
                  : 'Booking cancelled successfully!'
              );
            } catch (error: any) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

  const clearAllTrips = async () => {
    if (!profile?.uid) {
      Alert.alert('Error', 'Please log in to clear trips.');
      return;
    }

    if (bookings.length === 0) {
      Alert.alert('No Trips', 'You don\'t have any trips to clear.');
      return;
    }

    Alert.alert(
      'Clear All Trips',
      `This will permanently delete all ${bookings.length} trip bookings. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Starting to clear all trips...');
              
              // Calculate total refund amount
              const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
              const totalRefund = paidBookings.reduce((sum, booking) => sum + booking.price, 0);
              
              // Refund money for all paid bookings
              if (paidBookings.length > 0) {
                await balanceService.addMoney(
                  profile.uid!,
                  totalRefund,
                  'USD',
                  `Refund for clearing all trips (${paidBookings.length} paid bookings)`
                );
              }
              
              // Delete all bookings
              const deletePromises = bookings.map(async (booking) => {
                try {
                  await deleteDoc(doc(db, 'users', profile.uid!, 'bookings', booking.id));
                  console.log(`✅ Deleted booking: ${booking.id}`);
                  return booking.id;
                } catch (error) {
                  console.error(`❌ Failed to delete booking ${booking.id}:`, error);
                  throw error;
                }
              });
              
              await Promise.all(deletePromises);
              
              // Clear the local state
              setBookings([]);
              
              console.log(`✅ Successfully deleted ${bookings.length} bookings`);
              
              Alert.alert(
                'Success!', 
                totalRefund > 0 
                  ? `All ${bookings.length} trips cleared! ${paidBookings.length} paid bookings refunded ($${totalRefund}).`
                  : `All ${bookings.length} trips have been cleared successfully!`
              );
              
            } catch (error: any) {
              console.error('Error clearing trips:', error);
              Alert.alert('Error', error.message || 'Failed to clear trips');
            }
          }
        }
      ]
    );
  };

  const handlePayBooking = async (booking: Booking) => {
    if (!profile?.uid) {
      Alert.alert('Error', 'Please log in to make payments.');
      return;
    }

    Alert.alert(
      'Pay for Booking',
      `Pay ${booking.currency} ${booking.price} for ${booking.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            try {
              console.log('💳 Processing payment for booking:', booking.id);
              
              // Deduct money from balance
              await balanceService.deductMoney(
                profile.uid!,
                booking.price,
                booking.currency,
                `Payment for ${booking.title}`,
                booking.id
              );
              
              // Update booking payment status in Firestore
              await updateDoc(doc(db, 'users', profile.uid!, 'bookings', booking.id), {
                paymentStatus: 'paid',
                paymentDate: new Date().toISOString()
              });
              
              // Update local state
              setBookings(prev => prev.map(b => 
                b.id === booking.id 
                  ? { ...b, paymentStatus: 'paid' as const }
                  : b
              ));
              
              Alert.alert(
                'Payment Successful!', 
                `Payment of ${booking.currency} ${booking.price} has been processed successfully!`
              );
              
            } catch (error: any) {
              console.error('Payment error:', error);
              if (error.message === 'Insufficient balance') {
                Alert.alert(
                  'Insufficient Balance',
                  'You don\'t have enough balance to make this payment. Please add money to your wallet first.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add Money', onPress: () => navigation.navigate('Dashboard' as never) }
                  ]
                );
              } else {
                Alert.alert('Payment Failed', error.message || 'Failed to process payment');
              }
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadBookings();
  }, [profile?.uid]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flight': return 'airplane';
      case 'hotel': return 'bed';
      case 'car': return 'car';
      default: return 'document';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your trips...</Text>
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
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>My Trips</Text>
            <Text style={styles.headerSubtitle}>
              {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
            </Text>
          </View>
          {bookings.length > 0 && (
            <TouchableOpacity 
              style={styles.deleteAllButton}
              onPress={clearAllTrips}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="airplane" size={60} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No trips yet</Text>
          <Text style={styles.emptyStateText}>
            Start exploring and book your first trip!
          </Text>
        </View>
      ) : (
        <View style={styles.bookingsContainer}>
          {bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bookingIcon}>
                  <Ionicons
                    name={getTypeIcon(booking.type)}
                    size={24}
                    color="#667eea"
                  />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingTitle}>{booking.title}</Text>
                  <Text style={styles.bookingDescription}>{booking.description}</Text>
                  <Text style={styles.bookingDate}>
                    Booked on {formatDate(booking.bookingDate)}
                  </Text>
                </View>
                <View style={styles.bookingPrice}>
                  <Text style={styles.priceText}>
                    ${booking.price}
                    <Text style={styles.currencyText}>/{booking.currency}</Text>
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(booking.status) }
                  ]}>
                    <Text style={styles.statusText}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {booking.details && (
                <View style={styles.bookingDetails}>
                  {booking.type === 'flight' && (
                    <>
                      <View style={styles.detailRow}>
                        <Ionicons name="airplane" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {booking.details.departure?.airport || booking.details.departure} → {booking.details.arrival?.airport || booking.details.arrival}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {booking.details.departure?.time || booking.details.departureTime} - {booking.details.arrival?.time || booking.details.arrivalTime}
                        </Text>
                      </View>
                      {booking.details.airline && (
                        <View style={styles.detailRow}>
                          <Ionicons name="business" size={16} color="#666" />
                          <Text style={styles.detailText}>
                            {booking.details.airline} • {booking.details.duration || 'Duration not specified'}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {booking.type === 'hotel' && (
                    <>
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {booking.details.address || booking.details.location || 'Location not specified'}
                        </Text>
                      </View>
                      {(booking.details.checkIn || booking.details.checkOut) && (
                        <View style={styles.detailRow}>
                          <Ionicons name="time" size={16} color="#666" />
                          <Text style={styles.detailText}>
                            Check-in: {booking.details.checkIn || 'Not specified'} | Check-out: {booking.details.checkOut || 'Not specified'}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {booking.type === 'car' && (
                    <>
                      <View style={styles.detailRow}>
                        <Ionicons name="car" size={16} color="#666" />
                        <Text style={styles.detailText}>
                          {booking.details.category || 'Car rental'} • {booking.details.transmission || 'Transmission not specified'}
                        </Text>
                      </View>
                      {booking.details.pickup && (
                        <View style={styles.detailRow}>
                          <Ionicons name="location" size={16} color="#666" />
                          <Text style={styles.detailText}>
                            Pickup: {booking.details.pickup}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              <View style={styles.bookingActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    navigation.navigate('BookingDetail' as never, { booking } as never);
                  }}
                >
                  <Ionicons name="eye" size={16} color="#667eea" />
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
                
                {booking.paymentStatus === 'paid' ? (
                  <View style={[styles.actionButton, styles.paidButton]}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={[styles.actionButtonText, styles.paidButtonText]}>
                      Paid
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.payButton]}
                    onPress={() => handlePayBooking(booking)}
                  >
                    <Ionicons name="card" size={16} color="#10b981" />
                    <Text style={[styles.actionButtonText, styles.payButtonText]}>
                      Pay {booking.currency} {booking.price}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {booking.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancelBooking(booking.id)}
                  >
                    <Ionicons name="close" size={16} color="#ef4444" />
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                )}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
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
  deleteAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
  bookingsContainer: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f0f2ff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookingDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: '#999',
  },
  bookingPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  currencyText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  bookingDetails: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f2ff',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  payButton: {
    backgroundColor: '#f0fdf4',
  },
  payButtonText: {
    color: '#10b981',
  },
  paidButton: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  paidButtonText: {
    color: '#10b981',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
  },
  cancelButtonText: {
    color: '#ef4444',
  },
});