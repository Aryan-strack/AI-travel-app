import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
  searchType?: 'hotels' | 'flights' | 'cars';
  clearForm?: boolean;
}

export interface SearchFilters {
  origin?: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  budget: number;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, loading, searchType = 'hotels', clearForm = false }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    origin: '',
    destination: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
    budget: 0,
  });

  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now

  // Clear form when clearForm prop is true
  useEffect(() => {
    if (clearForm) {
      console.log('🧹 Clearing search form');
      setFilters({
        origin: '',
        destination: '',
        checkIn: '',
        checkOut: '',
        guests: 0,
        budget: 0,
      });
      setCheckInDate(new Date());
      setCheckOutDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }
  }, [clearForm]);

  // Date picker handlers
  const handleCheckInDateChange = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(false);
    if (selectedDate) {
      setCheckInDate(selectedDate);
      setFilters(prev => ({ ...prev, checkIn: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const handleCheckOutDateChange = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(false);
    if (selectedDate) {
      setCheckOutDate(selectedDate);
      setFilters(prev => ({ ...prev, checkOut: selectedDate.toISOString().split('T')[0] }));
    }
  };

  const handleSearch = () => {
    if (!filters.destination.trim()) {
      Alert.alert('Error', 'Please enter a destination');
      return;
    }
    if (searchType === 'flights' && !filters.origin?.trim()) {
      Alert.alert('Error', 'Please enter an origin city');
      return;
    }
    if (!filters.checkIn.trim()) {
      Alert.alert('Error', `Please enter your ${getDateLabel().toLowerCase()} date`);
      return;
    }
    if (!filters.checkOut.trim()) {
      Alert.alert('Error', `Please enter your ${getReturnLabel().toLowerCase()} date`);
      return;
    }
    if (filters.guests <= 0) {
      Alert.alert('Error', `Please enter the number of ${getGuestsLabel().toLowerCase()}`);
      return;
    }
    if (filters.budget <= 0) {
      Alert.alert('Error', 'Please enter your maximum budget');
      return;
    }
    onSearch(filters);
  };

  const getTitle = () => {
    switch (searchType) {
      case 'flights': return 'Search Flights';
      case 'cars': return 'Search Cars';
      default: return 'Search Hotels';
    }
  };

  const getDestinationPlaceholder = () => {
    switch (searchType) {
      case 'flights': return 'Where are you flying to?';
      case 'cars': return 'Where do you need a car?';
      default: return 'Where are you going?';
    }
  };

  const getDateLabel = () => {
    switch (searchType) {
      case 'flights': return 'Select Departure Date';
      case 'cars': return 'Select Pick-up Date';
      default: return 'Select Check-in Date';
    }
  };

  const getReturnLabel = () => {
    switch (searchType) {
      case 'flights': return 'Select Return Date';
      case 'cars': return 'Select Drop-off Date';
      default: return 'Select Check-out Date';
    }
  };

  const getGuestsLabel = () => {
    switch (searchType) {
      case 'flights': return 'Passengers (1-9)';
      case 'cars': return 'Drivers (1-9)';
      default: return 'Guests (1-9)';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>{getTitle()}</Text>
        
        {/* Origin Input (for flights) */}
        {searchType === 'flights' && (
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Ionicons name="airplane" size={20} color="#667eea" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Where are you flying from?"
              placeholderTextColor="#999"
              value={filters.origin || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, origin: text }))}
            />
          </View>
        )}
        
        {/* Destination Input */}
        <View style={styles.inputGroup}>
          <View style={styles.inputIcon}>
            <Ionicons name="location" size={20} color="#667eea" />
          </View>
          <TextInput
            style={styles.input}
            placeholder={getDestinationPlaceholder()}
            placeholderTextColor="#999"
            value={filters.destination}
            onChangeText={(text) => setFilters(prev => ({ ...prev, destination: text }))}
          />
        </View>

        {/* Date Inputs */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <View style={styles.inputIcon}>
              <Ionicons name="calendar" size={20} color="#667eea" />
            </View>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowCheckInPicker(true)}
            >
              <Text style={[styles.dateText, !filters.checkIn && styles.placeholderText]}>
                {filters.checkIn || getDateLabel()}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <View style={styles.inputIcon}>
              <Ionicons name="calendar" size={20} color="#667eea" />
            </View>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowCheckOutPicker(true)}
            >
              <Text style={[styles.dateText, !filters.checkOut && styles.placeholderText]}>
                {filters.checkOut || getReturnLabel()}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Guests and Budget */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <View style={styles.inputIcon}>
              <Ionicons name="people" size={20} color="#667eea" />
            </View>
            <TextInput
              style={styles.input}
              placeholder={getGuestsLabel()}
              placeholderTextColor="#999"
              value={filters.guests === 0 ? '' : filters.guests.toString()}
              onChangeText={(text) => setFilters(prev => ({ 
                ...prev, 
                guests: parseInt(text) || 0 
              }))}
              keyboardType="numeric"
            />
          </View>
          
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <View style={styles.inputIcon}>
              <Ionicons name="cash" size={20} color="#667eea" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Max Budget (USD)"
              placeholderTextColor="#999"
              value={filters.budget === 0 ? '' : filters.budget.toString()}
              onChangeText={(text) => setFilters(prev => ({ 
                ...prev, 
                budget: parseInt(text) || 0 
              }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.searchButtonGradient}
          >
            <Ionicons name="search" size={20} color="white" />
            <Text style={styles.searchButtonText}>
              {loading ? 'Searching...' : `Search ${searchType.charAt(0).toUpperCase() + searchType.slice(1)}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showCheckInPicker && (
        <DateTimePicker
          value={checkInDate}
          mode="date"
          display="default"
          onChange={handleCheckInDateChange}
          minimumDate={new Date()}
        />
      )}

      {showCheckOutPicker && (
        <DateTimePicker
          value={checkOutDate}
          mode="date"
          display="default"
          onChange={handleCheckOutDateChange}
          minimumDate={checkInDate}
        />
      )}
    </View>
  );
};

// Helper functions
function getCurrentDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getNextWeekDate(): string {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  return nextWeek.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  searchButton: {
    marginTop: 8,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Date input styles
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
});
