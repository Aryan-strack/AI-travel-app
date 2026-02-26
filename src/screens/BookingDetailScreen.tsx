import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface BookingDetailScreenProps {
  route: {
    params: {
      booking: {
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
      };
    };
  };
}

export const BookingDetailScreen: React.FC<BookingDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { booking } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
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
    try {
      // Handle different date formats
      let date;
      if (dateString && typeof dateString === 'string') {
        // Check if it's a timestamp object or string
        if (dateString.includes('T') || dateString.includes('-')) {
          date = new Date(dateString);
        } else {
          // Handle timestamp
          date = new Date(parseInt(dateString));
        }
      } else if (dateString && typeof dateString === 'object') {
        // Handle Firestore timestamp
        date = new Date(dateString.seconds * 1000);
      } else {
        return 'Date not available';
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date not available';
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            // Handle cancellation logic here
            Alert.alert('Success', 'Booking cancelled successfully');
            navigation.goBack();
          },
        },
      ]
    );
  };


  const renderFlightDetails = () => (
    <View style={styles.detailsSection}>
      <Text style={styles.sectionTitle}>Flight Details</Text>
      
      <View style={styles.detailCard}>
        {booking.details?.airline && (
          <View style={styles.detailRow}>
            <Ionicons name="airplane" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Airline</Text>
              <Text style={styles.detailValue}>{booking.details.airline}</Text>
            </View>
          </View>
        )}

        {booking.details?.flightNumber && (
          <View style={styles.detailRow}>
            <Ionicons name="document" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Flight Number</Text>
              <Text style={styles.detailValue}>{booking.details.flightNumber}</Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="location" size={20} color="#667eea" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Route</Text>
            <Text style={styles.detailValue}>
              {booking.details?.departure?.airport || booking.details?.departure || 'N/A'} → {booking.details?.arrival?.airport || booking.details?.arrival || 'N/A'}
            </Text>
          </View>
        </View>

        {booking.details?.departure?.city && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Departure</Text>
              <Text style={styles.detailValue}>
                {booking.details.departure.city} ({booking.details.departure.airport})
              </Text>
            </View>
          </View>
        )}

        {booking.details?.arrival?.city && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Arrival</Text>
              <Text style={styles.detailValue}>
                {booking.details.arrival.city} ({booking.details.arrival.airport})
              </Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="time" size={20} color="#667eea" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Departure Time</Text>
            <Text style={styles.detailValue}>
              {booking.details?.departure?.time || booking.details?.departureTime || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time" size={20} color="#667eea" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Arrival Time</Text>
            <Text style={styles.detailValue}>
              {booking.details?.arrival?.time || booking.details?.arrivalTime || 'Not specified'}
            </Text>
          </View>
        </View>

        {booking.details?.duration && (
          <View style={styles.detailRow}>
            <Ionicons name="hourglass" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{booking.details.duration}</Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="layers" size={20} color="#667eea" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Stops</Text>
            <Text style={styles.detailValue}>
              {booking.details?.stops === 0 ? 'Direct flight' : `${booking.details?.stops || 0} stops`}
            </Text>
          </View>
        </View>

        {booking.details?.aircraft && (
          <View style={styles.detailRow}>
            <Ionicons name="airplane" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Aircraft</Text>
              <Text style={styles.detailValue}>{booking.details.aircraft}</Text>
            </View>
          </View>
        )}

        {booking.details?.class && (
          <View style={styles.detailRow}>
            <Ionicons name="star" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Class</Text>
              <Text style={styles.detailValue}>{booking.details.class}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderHotelDetails = () => (
    <View style={styles.detailsSection}>
      <Text style={styles.sectionTitle}>Hotel Details</Text>
      
      <View style={styles.detailCard}>
        {booking.details?.rating && (
          <View style={styles.detailRow}>
            <Ionicons name="star" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Rating</Text>
              <Text style={styles.detailValue}>{booking.details.rating} stars</Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="location" size={20} color="#667eea" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>
              {booking.details?.address || booking.details?.location || 'Address not available'}
            </Text>
          </View>
        </View>

        {booking.details?.checkIn && (
          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Check-in Date</Text>
              <Text style={styles.detailValue}>{booking.details.checkIn}</Text>
            </View>
          </View>
        )}

        {booking.details?.checkOut && (
          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Check-out Date</Text>
              <Text style={styles.detailValue}>{booking.details.checkOut}</Text>
            </View>
          </View>
        )}

        {booking.details?.amenities && booking.details.amenities.length > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="list" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Amenities</Text>
              <Text style={styles.detailValue}>{booking.details.amenities.join(', ')}</Text>
            </View>
          </View>
        )}

        {booking.details?.roomType && (
          <View style={styles.detailRow}>
            <Ionicons name="bed" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Room Type</Text>
              <Text style={styles.detailValue}>{booking.details.roomType}</Text>
            </View>
          </View>
        )}

        {booking.details?.guests && (
          <View style={styles.detailRow}>
            <Ionicons name="people" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Guests</Text>
              <Text style={styles.detailValue}>{booking.details.guests} people</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderCarDetails = () => (
    <View style={styles.detailsSection}>
      <Text style={styles.sectionTitle}>Car Details</Text>
      
      <View style={styles.detailCard}>
        {booking.details?.company && (
          <View style={styles.detailRow}>
            <Ionicons name="business" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Company</Text>
              <Text style={styles.detailValue}>{booking.details.company}</Text>
            </View>
          </View>
        )}

        {booking.details?.model && (
          <View style={styles.detailRow}>
            <Ionicons name="car" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Model</Text>
              <Text style={styles.detailValue}>{booking.details.model}</Text>
            </View>
          </View>
        )}

        {booking.details?.category && (
          <View style={styles.detailRow}>
            <Ionicons name="layers" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{booking.details.category}</Text>
            </View>
          </View>
        )}

        {booking.details?.transmission && (
          <View style={styles.detailRow}>
            <Ionicons name="settings" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Transmission</Text>
              <Text style={styles.detailValue}>{booking.details.transmission}</Text>
            </View>
          </View>
        )}

        {booking.details?.seats && (
          <View style={styles.detailRow}>
            <Ionicons name="people" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Seats</Text>
              <Text style={styles.detailValue}>{booking.details.seats} seats</Text>
            </View>
          </View>
        )}

        {booking.details?.fuelType && (
          <View style={styles.detailRow}>
            <Ionicons name="flash" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Fuel Type</Text>
              <Text style={styles.detailValue}>{booking.details.fuelType}</Text>
            </View>
          </View>
        )}

        {booking.details?.pickup && (
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>{booking.details.pickup}</Text>
            </View>
          </View>
        )}

        {booking.details?.features && booking.details.features.length > 0 && (
          <View style={styles.detailRow}>
            <Ionicons name="list" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Features</Text>
              <Text style={styles.detailValue}>{booking.details.features.join(', ')}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons
              name={getTypeIcon(booking.type)}
              size={32}
              color="#667eea"
            />
          </View>
          <Text style={styles.headerTitle}>{booking.title}</Text>
          <Text style={styles.headerSubtitle}>{booking.description}</Text>
        </View>
      </LinearGradient>

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(booking.status) }
        ]}>
          <Ionicons
            name={getStatusIcon(booking.status)}
            size={16}
            color="white"
          />
          <Text style={styles.statusText}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Price Section */}
      <View style={styles.priceSection}>
        <Text style={styles.priceLabel}>Total Amount</Text>
        <Text style={styles.priceValue}>
          ${booking.price}
          <Text style={styles.currencyText}>/{booking.currency}</Text>
        </Text>
      </View>

      {/* Booking Information */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Booking Information</Text>
        
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="receipt" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Booking ID</Text>
              <Text style={styles.detailValue}>{booking.id}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Booking Date</Text>
              <Text style={styles.detailValue}>{formatDate(booking.bookingDate)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="card" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Total Price</Text>
              <Text style={styles.detailValue}>
                {booking.currency} {booking.price}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color="#667eea" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailValue}>
                {booking.searchFilters?.destination || 
                 booking.details?.address || 
                 booking.details?.location || 
                 'Not specified'}
              </Text>
            </View>
          </View>

          {booking.searchFilters?.guests && (
            <View style={styles.detailRow}>
              <Ionicons name="people" size={20} color="#667eea" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Guests</Text>
                <Text style={styles.detailValue}>{booking.searchFilters.guests} people</Text>
              </View>
            </View>
          )}

          {booking.searchFilters?.budget && (
            <View style={styles.detailRow}>
              <Ionicons name="wallet" size={20} color="#667eea" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Budget</Text>
                <Text style={styles.detailValue}>{booking.currency} {booking.searchFilters.budget}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Type-specific Details */}
      {booking.type === 'flight' && renderFlightDetails()}
      {booking.type === 'hotel' && renderHotelDetails()}
      {booking.type === 'car' && renderCarDetails()}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {booking.status === 'confirmed' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelBooking}
          >
            <Ionicons name="close" size={20} color="#ef4444" />
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => Alert.alert('Contact', 'Customer support contact options')}
        >
          <Ionicons name="call" size={20} color="#10b981" />
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 20,
  },
  headerIcon: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: -15,
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  priceSection: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
  },
  currencyText: {
    fontSize: 16,
    color: '#666',
  },
  detailsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  actionSection: {
    padding: 20,
    paddingBottom: 40,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  contactButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
});
