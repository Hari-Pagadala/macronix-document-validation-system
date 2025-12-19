import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { foService } from '../services/apiService';

const getValue = (data, keys, fallback = 'Not available') => {
  for (const k of keys) {
    if (data && data[k]) return data[k];
  }
  return fallback;
};

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('fieldOfficerData');
      if (stored) {
        setProfile(JSON.parse(stored));
      }

      // Fetch fresh profile from API to ensure latest info
      const response = await foService.getProfile();
      if (response?.data?.success && response.data.profile) {
        setProfile(response.data.profile);
        await AsyncStorage.setItem('fieldOfficerData', JSON.stringify(response.data.profile));
      }
    } catch (err) {
      console.error('Profile load error', err);
      if (err.response?.status === 401) {
        await AsyncStorage.removeItem('fieldOfficerToken');
        await AsyncStorage.removeItem('fieldOfficerData');
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      } else {
        Alert.alert('Error', 'Failed to load profile. Pull to refresh or try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('fieldOfficerToken');
            await AsyncStorage.removeItem('fieldOfficerData');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (err) {
            Alert.alert('Error', 'Logout failed. Please try again.');
          }
        },
      },
    ]);
  };

  const fullName = profile
    ? getValue(profile, ['name', 'fullName']) || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Not available'
    : 'Not available';

  const email = profile ? getValue(profile, ['email', 'username']) : 'Not available';
  const mobile = profile ? getValue(profile, ['mobile', 'contactNumber', 'phone', 'phoneNumber']) : 'Not available';
  const vendorName = profile ? getValue(profile, ['vendorName', 'vendorCompanyName', 'vendor', 'company']) : 'Not available';
  const role = 'Field Officer';

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Full Name</Text>
            <Text style={styles.value}>{fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email ID</Text>
            <Text style={styles.value}>{email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mobile Number</Text>
            <Text style={styles.value}>{mobile}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Vendor Name</Text>
            <Text style={styles.value}>{vendorName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{role}</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 12,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 18,
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ProfileScreen;
