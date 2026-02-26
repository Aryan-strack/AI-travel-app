import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import TravelPlannerScreen from '../screens/TravelPlannerScreen';
import DestinationScreen from '../screens/DestinationScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  TravelPlanner: undefined;
  Destination: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export const DashboardStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
        name="DashboardHome" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TravelPlanner" 
        component={TravelPlannerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Destination" 
        component={DestinationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

