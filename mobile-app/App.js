import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import CaseListingScreen from './screens/CaseListingScreen';
import CaseDetailsScreen from './screens/CaseDetailsScreen';
import SubmitVerificationScreen from './screens/SubmitVerificationScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = React.useState('Login');
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    checkUserLogin();
  }, []);

  const checkUserLogin = async () => {
    try {
      const token = await AsyncStorage.getItem('fieldOfficerToken');
      if (token) {
        setInitialRoute('CaseListing');
      }
    } catch (err) {
      console.error('Error checking login:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = (navigation) => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            console.log('Logout: removing token and profile');
            await AsyncStorage.removeItem('fieldOfficerToken');
            await AsyncStorage.removeItem('fieldOfficerData');
            // double-check removal
            const t = await AsyncStorage.getItem('fieldOfficerToken');
            console.log('Logout: token after removal =', t);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (err) {
            console.error('Logout error', err);
            Alert.alert('Error', 'Logout failed. Please try again.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  if (loading) {
    return null; // Show splash screen or loading indicator
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: '#667eea',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerRight: () => (
            <TouchableOpacity
              style={{
                marginRight: 12,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                Profile
              </Text>
            </TouchableOpacity>
          ),
        })}
        initialRouteName={initialRoute}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CaseListing"
          component={CaseListingScreen}
          options={{
            title: 'Macronix',
          }}
        />
        <Stack.Screen
          name="CaseDetails"
          component={CaseDetailsScreen}
          options={{
            title: 'Case Details',
          }}
        />
        <Stack.Screen
          name="SubmitVerification"
          component={SubmitVerificationScreen}
          options={{
            title: 'Submit Verification',
          }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: 'Profile',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
