import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { balanceService, BalanceInfo } from '../services/BalanceService';
import { AddMoneyModal } from '../components/AddMoneyModal';
import { TravelLibraryService } from '../services/TravelLibraryService';
import { RecentTripsService } from '../services/RecentTripsService';

const { width } = Dimensions.get('window');

interface DashboardCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string, ...string[]];
  onPress: () => void;
}

interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'car';
  title: string;
  price: number;
  currency: string;
  bookingDate: string;
  status: string;
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
}

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface CostData {
  category: string;
  amount: number;
  color: string;
}

interface TotalExpenseData {
  totalAmount: number;
  currency: string;
  bookingCount: number;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, subtitle, icon, gradient, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.cardContainer}>
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={32} color="white" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const QuickActionButton: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  gradient?: readonly [string, string, ...string[]];
}> = ({ icon, label, onPress, gradient }) => (
  <TouchableOpacity onPress={onPress} style={styles.quickAction}>
    <LinearGradient
      colors={gradient || ['#667eea', '#764ba2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.quickActionGradient}
    >
      <Ionicons name={icon} size={28} color="white" />
    </LinearGradient>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

// Weather Widget Component
const WeatherWidget: React.FC<{ 
  weather: WeatherData; 
  onLocationChange: () => void; 
}> = ({ weather, onLocationChange }) => (
  <View style={styles.weatherCard}>
    <View style={styles.weatherHeader}>
      <View style={styles.weatherLocationContainer}>
      <Ionicons name="location" size={16} color="#666" />
      <Text style={styles.weatherLocation}>{weather.location}</Text>
      </View>
      <TouchableOpacity style={styles.weatherLocationButton} onPress={onLocationChange}>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>
    </View>
    <View style={styles.weatherMain}>
      <View style={styles.weatherIconContainer}>
        <Ionicons name={weather.icon as any} size={36} color="#f59e0b" />
      </View>
      <View style={styles.weatherInfo}>
        <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
        <Text style={styles.weatherCondition}>{weather.condition}</Text>
      </View>
    </View>
    <View style={styles.weatherDetails}>
      <View style={styles.weatherDetail}>
        <Ionicons name="water" size={14} color="#3b82f6" />
        <Text style={styles.weatherDetailText}>{weather.humidity}%</Text>
      </View>
      <View style={styles.weatherDetail}>
        <Ionicons name="leaf" size={14} color="#10b981" />
        <Text style={styles.weatherDetailText}>{weather.windSpeed} km/h</Text>
      </View>
    </View>
  </View>
);

// Balance Widget Component
const BalanceWidget: React.FC<{ balance: BalanceInfo; onAddMoney: () => void }> = ({ balance, onAddMoney }) => (
  <View style={styles.balanceCard}>
    <View style={styles.balanceHeader}>
      <Ionicons name="wallet" size={24} color="#667eea" />
      <Text style={styles.balanceTitle}>Wallet Balance</Text>
    </View>
    <View style={styles.balanceMain}>
      <Text style={styles.balanceAmount}>
        ${balance.totalBalance.toLocaleString()}
      </Text>
      <Text style={styles.balanceSubtitle}>
        Available for payments
      </Text>
    </View>
    <TouchableOpacity style={styles.addMoneyButton} onPress={onAddMoney}>
      <Ionicons name="add" size={16} color="white" />
      <Text style={styles.addMoneyButtonText}>Add Money</Text>
    </TouchableOpacity>
  </View>
);

// Total Expense Widget Component
const TotalExpenseWidget: React.FC<{ expenseData: TotalExpenseData }> = ({ expenseData }) => (
  <View style={styles.expenseCard}>
    <View style={styles.expenseHeader}>
      <Ionicons name="receipt" size={24} color="#10b981" />
      <Text style={styles.expenseTitle}>Total Expenses</Text>
    </View>
    <View style={styles.expenseMain}>
      <Text style={styles.expenseAmount}>
        {expenseData.currency} {expenseData.totalAmount.toLocaleString()}
      </Text>
      <Text style={styles.expenseSubtitle}>
        {expenseData.bookingCount > 0 
          ? `${expenseData.bookingCount} booking${expenseData.bookingCount !== 1 ? 's' : ''} paid`
          : 'No expenses yet'
        }
      </Text>
    </View>
    <View style={styles.expenseFooter}>
      <View style={styles.expenseStat}>
        <Ionicons 
          name={expenseData.totalAmount > 0 ? "trending-up" : "wallet"} 
          size={16} 
          color={expenseData.totalAmount > 0 ? "#10b981" : "#6b7280"} 
        />
        <Text style={styles.expenseStatText}>
          {expenseData.totalAmount > 0 ? 'Active' : 'Ready'}
        </Text>
      </View>
      <View style={styles.expenseStat}>
        <Ionicons name="calendar" size={16} color="#6b7280" />
        <Text style={styles.expenseStatText}>This Month</Text>
      </View>
    </View>
  </View>
);

// Cost Chart Component
const CostChart: React.FC<{ costData: CostData[] }> = ({ costData }) => {
  const totalAmount = costData.reduce((sum, item) => sum + item.amount, 0);
  
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>Travel Expenses</Text>
      <View style={styles.chartContainer}>
        {costData.map((item, index) => {
          const percentage = (item.amount / totalAmount) * 100;
          return (
            <View key={index} style={styles.chartItem}>
              <View style={styles.chartBarContainer}>
                <View 
                  style={[
                    styles.chartBar, 
                    { 
                      width: `${percentage}%`, 
                      backgroundColor: item.color 
                    }
                  ]} 
                />
              </View>
              <View style={styles.chartLabel}>
                <View style={[styles.chartColorDot, { backgroundColor: item.color }]} />
                <Text style={styles.chartLabelText}>{item.category}</Text>
                <Text style={styles.chartAmount}>${item.amount}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.chartTotal}>
        <Text style={styles.chartTotalLabel}>Total: ${totalAmount}</Text>
      </View>
    </View>
  );
};


export const DashboardScreen: React.FC = () => {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const [userName, setUserName] = useState<string | undefined>(profile?.userName || undefined);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [costData, setCostData] = useState<CostData[]>([]);
  const [totalExpense, setTotalExpense] = useState<TotalExpenseData>({ totalAmount: 0, currency: 'USD', bookingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState<BalanceInfo>({ totalBalance: 0, currency: 'USD', lastUpdated: null });
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showTravelLibrary, setShowTravelLibrary] = useState(false);
  const [showRecentTrips, setShowRecentTrips] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('London, UK');

  useEffect(() => {
    // Directly use profile.userName from context - it's already real-time via Firestore subscription
    if (profile?.userName) {
      setUserName(profile.userName);
    } else if (profile?.uid) {
      // Fallback to cached data if profile.userName is not immediately available
      const checkCachedData = async () => {
        try {
          const cached = await AsyncStorage.getItem(`profile:cached:${profile.uid}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed?.userName) {
              setUserName(parsed.userName);
            }
          }
        } catch (error) {
          console.log('Failed to load cached userName:', error);
        }
      };
      checkCachedData();
    }
  }, [profile?.userName, profile?.uid]);

  useEffect(() => {
    loadDashboardData();
  }, [profile?.uid]);

  // Debug profile photo and load from AsyncStorage
  useEffect(() => {
    console.log('🔍 Profile object:', JSON.stringify(profile, null, 2));
    console.log('📷 Profile photoURL:', profile?.photoURL);
    console.log('👤 Profile preferences photoURL:', (profile?.preferences as any)?.photoURL);
    
    // Load profile photo from AsyncStorage if not in profile
    const loadProfilePhotoFromStorage = async () => {
      if (profile?.uid && !profile?.photoURL) {
        try {
          const cachedProfile = await AsyncStorage.getItem(`profile:cached:${profile.uid}`);
          if (cachedProfile) {
            const parsedProfile = JSON.parse(cachedProfile);
            console.log('📱 Cached profile from AsyncStorage:', parsedProfile);
            if (parsedProfile.photoURL || parsedProfile.preferences?.photoURL) {
              console.log('🖼️ Found cached photoURL:', parsedProfile.photoURL || parsedProfile.preferences?.photoURL);
            }
          }
        } catch (error) {
          console.log('❌ Error loading cached profile:', error);
        }
      }
    };
    
    loadProfilePhotoFromStorage();
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load recent bookings
      await loadRecentBookings();
      
      // Load weather data
      await loadWeatherData();
      
      // Load balance
      await loadBalance();
      
      // Calculate cost data
      calculateCostData();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentBookings = async () => {
    try {
      const bookingsRef = collection(db, 'users', profile!.uid, 'bookings');
      // Remove limit(5) to load ALL bookings for proper expense calculation
      const q = query(bookingsRef, orderBy('bookingDate', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const bookingData = doc.data();
        const booking: Booking = {
          id: doc.id,
          type: bookingData.type || 'hotel',
          title: bookingData.title || 'Untitled',
          price: bookingData.price || 0,
          currency: bookingData.currency || 'USD',
          bookingDate: bookingData.bookingDate || new Date().toISOString(),
          status: bookingData.status || 'confirmed',
          paymentStatus: bookingData.paymentStatus || 'unpaid',
        };
        bookingsData.push(booking);
      });
      
      setBookings(bookingsData);
      // Set recent bookings (first 5) for the recent bookings section
      setRecentBookings(bookingsData.slice(0, 5));
      console.log('📊 Loaded all bookings for expense calculation:', bookingsData.length);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadWeatherData = async (location: string = selectedCountry) => {
    try {
      console.log('🌤️ Loading weather data for:', location);
      
      // Extract city name from location string (remove country if present)
      const cityName = location.split(',')[0].trim();
      
      // WeatherAPI.com API call
      const API_KEY = '2c0c369de2664b828ca184346252204';
      const API_URL = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(cityName)}&aqi=no`;
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map weather condition to icon
      const getWeatherIcon = (condition: string): string => {
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return 'sunny';
        if (conditionLower.includes('partly cloudy')) return 'partly-sunny';
        if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) return 'cloudy';
        if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return 'rainy';
        if (conditionLower.includes('snow')) return 'snow';
        if (conditionLower.includes('fog') || conditionLower.includes('mist')) return 'cloudy';
        return 'partly-sunny'; // default
      };
      
      const weatherData: WeatherData = {
        location: `${data.location.name}, ${data.location.country}`,
        temperature: Math.round(data.current.temp_c),
        condition: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: Math.round(data.current.wind_kph / 3.6), // Convert km/h to m/s
        icon: getWeatherIcon(data.current.condition.text)
      };
      
      console.log('✅ Weather data loaded successfully:', weatherData);
      setWeather(weatherData);
      
    } catch (error) {
      console.error('❌ Error loading weather data:', error);
      
      // Fallback to default weather data
      const fallbackWeather: WeatherData = {
        location: location,
        temperature: 22,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        icon: 'partly-sunny'
      };
      
      setWeather(fallbackWeather);
    }
  };

  const loadBalance = async () => {
    try {
      if (profile?.uid) {
        const balanceInfo = await balanceService.getUserBalance(profile.uid);
        setBalance(balanceInfo);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      // Set default balance if error
      setBalance({ totalBalance: 0, currency: 'USD', lastUpdated: null });
    }
  };

  const calculateCostData = () => {
    // Calculate cost breakdown from PAID bookings only
    const paidBookings = bookings.filter(b => b.paymentStatus === 'paid');
    
    const flightCost = paidBookings
      .filter(b => b.type === 'flight')
      .reduce((sum, b) => sum + b.price, 0);
    
    const hotelCost = paidBookings
      .filter(b => b.type === 'hotel')
      .reduce((sum, b) => sum + b.price, 0);
    
    const carCost = paidBookings
      .filter(b => b.type === 'car')
      .reduce((sum, b) => sum + b.price, 0);

    const costData: CostData[] = [
      { category: 'Flights', amount: flightCost, color: '#3b82f6' },
      { category: 'Hotels', amount: hotelCost, color: '#10b981' },
      { category: 'Cars', amount: carCost, color: '#f59e0b' },
    ].filter(item => item.amount > 0);

    setCostData(costData);

    // Calculate total expense (only paid bookings)
    const totalAmount = flightCost + hotelCost + carCost;
    const bookingCount = paidBookings.length;
    const currency = paidBookings.length > 0 ? paidBookings[0].currency : 'USD';
    
    setTotalExpense({
      totalAmount,
      currency,
      bookingCount
    });
  };

  const handleSearchPress = () => {
    navigation.navigate('Search' as never);
  };

  const handleBookingsPress = () => {
    navigation.navigate('Itinerary' as never);
  };

  const handleItineraryPress = () => {
    navigation.navigate('Itinerary' as never);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never);
  };

  const handleLibraryPress = () => {
    setShowTravelLibrary(true);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'Search':
        navigation.navigate('Search' as never);
        break;
      case 'Flights':
        navigation.navigate('Search' as never);
        break;
      case 'Hotels':
        navigation.navigate('Search' as never);
        break;
      case 'Cars':
        navigation.navigate('Search' as never);
        break;
      default:
        console.log(`${action} pressed`);
    }
  };

  const handleAddMoney = () => {
    if (!profile?.uid) {
      Alert.alert('Error', 'Please log in to add money');
      return;
    }
    setShowAddMoneyModal(true);
  };

  const handleAddMoneySuccess = async (amount: number) => {
    // Reload balance after successful payment
    await loadBalance();
    console.log(`✅ Successfully added $${amount} to wallet`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDashboardData();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTravelLibraryPress = () => {
    setShowTravelLibrary(true);
  };

  const handleRecentTripsPress = () => {
    setShowRecentTrips(true);
  };

  const handleWeatherLocationChange = () => {
    setShowCountryPicker(true);
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    // Update weather data for the selected location
    loadWeatherData(country);
  };

  const handleTravelPlannerNav = () => {
    navigation.navigate('TravelPlanner' as never);
  };

  const handleDestinationNav = () => {
    navigation.navigate('Destination' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.userName}>{userName || profile?.email || 'Traveler'}</Text>
            <Text style={styles.headerSubtitle}>Ready for your next adventure?</Text>
          </View>
          <View style={styles.profilePhotoContainer}>
            {(profile?.photoURL || (profile?.preferences as any)?.photoURL) ? (
              <Image 
                source={{ uri: profile?.photoURL || (profile?.preferences as any)?.photoURL }} 
                style={styles.profilePhoto}
                onError={(error) => {
                  console.log('❌ Image load error:', error);
                  console.log('📷 PhotoURL:', profile?.photoURL || (profile?.preferences as any)?.photoURL);
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', profile?.photoURL || (profile?.preferences as any)?.photoURL);
                }}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Text style={styles.profilePhotoInitials}>
                  {userName 
                    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : profile?.email ? profile.email[0].toUpperCase() : 'U'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#667eea"
            colors={['#667eea', '#764ba2']}
          />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActionsContainer}>
            <QuickActionButton
              icon="search"
              label="Search"
              onPress={() => handleQuickAction('Search')}
              gradient={['#667eea', '#764ba2']}
            />
            <QuickActionButton
              icon="airplane"
              label="Flights"
              onPress={() => handleQuickAction('Flights')}
              gradient={['#f093fb', '#f5576c']}
            />
            <QuickActionButton
              icon="bed"
              label="Hotels"
              onPress={() => handleQuickAction('Hotels')}
              gradient={['#4facfe', '#00f2fe']}
            />
            <QuickActionButton
              icon="car"
              label="Cars"
              onPress={() => handleQuickAction('Cars')}
              gradient={['#43e97b', '#38f9d7']}
            />
          </View>
        </View>

        {/* Dashboard Grid */}
        <View style={styles.dashboardGrid}>
          {/* Balance Widget */}
          <View style={styles.dashboardItem}>
            <BalanceWidget balance={balance} onAddMoney={handleAddMoney} />
          </View>

          {/* Weather Widget */}
          {weather && (
            <View style={styles.dashboardItem}>
              <WeatherWidget weather={weather} onLocationChange={handleWeatherLocationChange} />
            </View>
          )}
        </View>

        {/* Second Row */}
        <View style={styles.dashboardGrid}>
            <View style={styles.dashboardItem}>
              <TotalExpenseWidget expenseData={totalExpense} />
            </View>
          <View style={styles.dashboardItem}>
            {/* Empty space for future widgets */}
          </View>
        </View>

        {/* Cost Chart - Full Width */}
        {costData.length > 0 && (
          <View style={styles.section}>
            <CostChart costData={costData} />
          </View>
        )}

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="airplane" size={24} color="#3b82f6" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{bookings.filter(b => b.type === 'flight').length}</Text>
              <Text style={styles.statLabel}>Flights</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="bed" size={24} color="#10b981" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{bookings.filter(b => b.type === 'hotel').length}</Text>
              <Text style={styles.statLabel}>Hotels</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="car" size={24} color="#f59e0b" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{bookings.filter(b => b.type === 'car').length}</Text>
              <Text style={styles.statLabel}>Cars</Text>
            </View>
        </View>
      </View>

      <View style={styles.section}>

      <Text style={styles.sectionTitle}>Smart Travel Tools</Text>
        <View style={styles.quickActionsContainer}>
          <QuickActionButton
            icon="compass"
            label="Travel Planner"
            onPress={handleTravelPlannerNav}
            gradient={['#8b5cf6', '#6366f1']}
          />
          <QuickActionButton
            icon="image"
            label="Destination Finder"
            onPress={handleDestinationNav}
            gradient={['#06b6d4', '#3b82f6']}
          />
        </View>
      </View>


        {/* Main Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Services</Text>
          
          <DashboardCard
            title="Search & Book"
            subtitle="Find flights, hotels, and transport"
            icon="search"
            gradient={['#f59e0b', '#f97316']}
            onPress={handleSearchPress}
          />
          
          <DashboardCard
            title="My Bookings"
            subtitle="Manage your reservations"
            icon="receipt"
            gradient={['#10b981', '#059669']}
            onPress={handleBookingsPress}
          />
          
          <DashboardCard
            title="Travel Library"
            subtitle="Browse destinations and save favorites"
            icon="library"
            gradient={['#ef4444', '#dc2626']}
            onPress={handleLibraryPress}
          />
          
          <DashboardCard
            title="Recent Trips"
            subtitle="View your completed and paid trips"
            icon="checkmark-circle"
            gradient={['#3b82f6', '#1d4ed8']}
            onPress={handleRecentTripsPress}
          />
        </View>
      </ScrollView>

      {/* Add Money Modal */}
      <AddMoneyModal
        visible={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
        onSuccess={handleAddMoneySuccess}
        currentBalance={balance.totalBalance}
        userId={profile?.uid || ''}
        onRefresh={loadBalance}
      />

      {/* Travel Library Service */}
      {showTravelLibrary && (
        <View style={styles.libraryOverlay}>
          <View style={styles.libraryContainer}>
            <View style={styles.libraryHeader}>
              <TouchableOpacity 
                style={styles.libraryCloseButton}
                onPress={() => setShowTravelLibrary(false)}
              >
                <Ionicons name="close" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
            <TravelLibraryService />
          </View>
        </View>
      )}

      {/* Recent Trips Service */}
      {showRecentTrips && (
        <View style={styles.libraryOverlay}>
          <View style={styles.libraryContainer}>
            <View style={styles.libraryHeader}>
              <TouchableOpacity 
                style={styles.libraryCloseButton}
                onPress={() => setShowRecentTrips(false)}
              >
                <Ionicons name="close" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
            <RecentTripsService />
          </View>
        </View>
      )}

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <View style={styles.countryPickerOverlay}>
          <View style={styles.countryPickerContainer}>
            <View style={styles.countryPickerHeader}>
              <Text style={styles.countryPickerTitle}>Select Location</Text>
              <TouchableOpacity 
                style={styles.countryPickerCloseButton}
                onPress={() => setShowCountryPicker(false)}
              >
                <Ionicons name="close" size={24} color="#667eea" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.countryPickerList}>
              {[
                'London, UK', 'New York, USA', 'Paris, France', 'Tokyo, Japan', 'Dubai, UAE', 'Sydney, Australia',
                'Islamabad, Pakistan', 'Karachi, Pakistan', 'Lahore, Pakistan',
                'Mumbai, India', 'Delhi, India',
                'Beijing, China', 'Shanghai, China',
                'Bangkok, Thailand', 'Singapore', 'Kuala Lumpur, Malaysia',
                'Jakarta, Indonesia', 'Manila, Philippines',
                'Seoul, South Korea', 'Hong Kong',
                'Toronto, Canada', 'Vancouver, Canada',
                'Berlin, Germany', 'Rome, Italy', 'Madrid, Spain',
                'Amsterdam, Netherlands', 'Stockholm, Sweden',
                'Moscow, Russia', 'Istanbul, Turkey',
                'Cairo, Egypt', 'Nairobi, Kenya', 'Cape Town, South Africa',
                'São Paulo, Brazil', 'Rio de Janeiro, Brazil',
                'Buenos Aires, Argentina', 'Mexico City, Mexico',
                'Los Angeles, USA', 'Chicago, USA', 'Miami, USA'
              ].map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.countryPickerItem,
                    selectedCountry === country && styles.countryPickerItemSelected
                  ]}
                  onPress={() => handleCountrySelect(country)}
                >
                  <Text style={[
                    styles.countryPickerItemText,
                    selectedCountry === country && styles.countryPickerItemTextSelected
                  ]}>
                    {country}
                  </Text>
                  {selectedCountry === country && (
                    <Ionicons name="checkmark" size={20} color="#667eea" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
  profilePhotoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profilePhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
    textAlign: 'center',
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  activityPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  // Dashboard grid styles
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    marginTop: 8,
  },
  dashboardItem: {
    width: '49%',
    marginBottom: 16,
  },
  // Weather widget styles
  weatherCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 160,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherLocation: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flex: 1,
  },
  weatherIconContainer: {
    marginRight: 12,
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  weatherCondition: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '500',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherDetailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  // Chart styles
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartItem: {
    marginBottom: 12,
  },
  chartBarContainer: {
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  chartLabelText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  chartAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  chartTotal: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  chartTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  // Stats container styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  // Balance widget styles
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  balanceMain: {
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addMoneyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
 


  // Total expense widget styles
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 140,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
  },
  expenseMain: {
    marginBottom: 12,
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  expenseSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseStatText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 4,
    flexShrink: 1,
  },
  // Travel Library Overlay Styles
  libraryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  libraryContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  libraryCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Weather widget location button styles
  weatherLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weatherLocationButton: {
    padding: 4,
    borderRadius: 4,
  },

  // Country picker modal styles
  countryPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  countryPickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  countryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  countryPickerCloseButton: {
    padding: 4,
    borderRadius: 4,
  },
  countryPickerList: {
    maxHeight: 400,
  },
  countryPickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  countryPickerItemSelected: {
    backgroundColor: '#f0f2ff',
  },
  countryPickerItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  countryPickerItemTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
});
