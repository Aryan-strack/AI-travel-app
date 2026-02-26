import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ItineraryScreen } from '../screens/ItineraryScreen';
import { BookingDetailScreen } from '../screens/BookingDetailScreen';

export type ItineraryStackParamList = {
  ItineraryList: undefined;
  BookingDetail: {
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

const Stack = createNativeStackNavigator<ItineraryStackParamList>();

export const ItineraryStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen 
        name="ItineraryList" 
        component={ItineraryScreen}
        options={{ 
          title: 'My Trips',
          headerShown: false 
        }}
      />
      <Stack.Screen 
        name="BookingDetail" 
        component={BookingDetailScreen}
        options={{ 
          title: 'Booking Details',
          headerShown: false 
        }}
      />
    </Stack.Navigator>
  );
};
