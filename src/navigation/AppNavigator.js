import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ResultsScreen from '../screens/ResultsScreen';
import MyCardsScreen from '../screens/MyCardsScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false, // We use custom headers in each screen
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Results" component={ResultsScreen} />
    </HomeStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#1A3C5E',
          tabBarInactiveTintColor: '#AAAAAA',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E8ECF0',
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color }) => {
            const icons = {
              Spend: focused ? '🛒' : '🛍️',
              MyCards: focused ? '💳' : '💳',
            };
            return (
              <Text style={{ fontSize: 22 }}>{icons[route.name] || '•'}</Text>
            );
          },
        })}
      >
        <Tab.Screen
          name="Spend"
          component={HomeStackNavigator}
          options={{ tabBarLabel: 'Best Card' }}
        />
        <Tab.Screen
          name="MyCards"
          component={MyCardsScreen}
          options={{ tabBarLabel: 'My Cards' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
