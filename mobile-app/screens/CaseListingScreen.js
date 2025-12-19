import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { caseService } from '../services/apiService';

const CaseListingScreen = ({ navigation }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('assigned');
  const [page, setPage] = useState(1);
  const [foName, setFoName] = useState('');

  useEffect(() => {
    fetchFOName();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [search, status]);

  const fetchFOName = async () => {
    try {
      const foData = await AsyncStorage.getItem('fieldOfficerData');
      if (foData) {
        const parsed = JSON.parse(foData);
        setFoName(parsed.fullName || parsed.name || '');
      }
    } catch (err) {
      console.error('Error fetching FO name:', err);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await caseService.getCases(status, search, page, 10);
      if (response.data.success) {
        setCases(response.data.records || []);
      } else {
        Alert.alert('Error', response.data.message || 'Failed to fetch cases');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('fieldOfficerToken');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        Alert.alert('Error', 'Failed to fetch cases');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCases();
  };

  const handleCasePress = (caseId) => {
    navigation.navigate('CaseDetails', { caseId });
  };

  const renderCaseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.caseCard}
      onPress={() => handleCasePress(item.id)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.caseNumber}>{item.caseNumber}</Text>
        <Text style={styles.refNumber}>{item.referenceNumber}</Text>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text style={styles.contact}>{item.contactNumber}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    const colors = {
      assigned: '#667eea',
      submitted: '#ffa500',
      insufficient: '#ff9800',
      approved: '#4caf50',
      rejected: '#f44336',
    };
    return colors[status] || '#999';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleSection}>
        <Text style={styles.titleMain}>My Cases</Text>
        {foName ? <Text style={styles.foName}>{foName}</Text> : null}
      </View>

      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search case number or name..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.filterRow}>
        {['assigned', 'submitted', 'insufficient', 'approved'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.filterButton,
              status === s && styles.filterButtonActive,
            ]}
            onPress={() => setStatus(s)}
          >
            <Text
              style={[
                styles.filterButtonText,
                status === s && styles.filterButtonTextActive,
              ]}
            >
              {s.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {cases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cases found</Text>
        </View>
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCaseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#667eea']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  titleSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleMain: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  foName: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
    marginTop: 4,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  caseCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    gap: 4,
  },
  caseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  refNumber: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '500',
  },
  name: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  contact: {
    fontSize: 12,
    color: '#888',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default CaseListingScreen;
