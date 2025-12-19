import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { caseService } from '../services/apiService';

const CaseDetailsScreen = ({ route, navigation }) => {
  const { caseId } = route.params;
  const [record, setRecord] = useState(null);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCaseDetails();
  }, [caseId]);

  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      const [recordRes, verificationRes] = await Promise.all([
        caseService.getCaseDetails(caseId),
        caseService.getVerification(caseId),
      ]);

      if (recordRes.data.success) {
        setRecord(recordRes.data.record);
      }
      // Verification may be null if case is assigned (not submitted yet)
      if (verificationRes.data.success && verificationRes.data.verification) {
        setVerification(verificationRes.data.verification);
      }
    } catch (error) {
      console.error('Error fetching case details:', error);
      Alert.alert('Error', 'Failed to fetch case details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = () => {
    if (!record) {
      Alert.alert('Error', 'Record data is missing');
      return;
    }
    console.log('Navigating to SubmitVerification with record:', record);
    navigation.navigate('SubmitVerification', { record });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!record) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Case not found</Text>
      </View>
    );
  }

  console.log('CaseDetailsScreen - Record status:', record?.status, 'Record:', record);

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Case Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Case Information</Text>
          <DetailRow label="Case Number" value={record.caseNumber} />
          <DetailRow label="Reference Number" value={record.referenceNumber} />
          <DetailRow label="Status" value={record.status?.toUpperCase()} />
          {record.status === 'rejected' && record.remarks && (
            <View style={styles.remarksContainer}>
              <Text style={styles.remarksLabel}>Rejection Reason:</Text>
              <Text style={styles.remarksText}>{record.remarks}</Text>
            </View>
          )}
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <DetailRow label="Name" value={record.fullName} />
          <DetailRow label="Contact" value={record.contactNumber} />
          <DetailRow label="Email" value={record.email} />
        </View>

        {/* Address Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          <DetailRow label="Address" value={record.address} />
          <DetailRow label="State" value={record.state} />
          <DetailRow label="District" value={record.district} />
          <DetailRow label="Pincode" value={record.pincode} />
        </View>

        {/* Verification Info */}
        {verification && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification Details</Text>
            <DetailRow label="Respondent Name" value={verification.respondentName} />
            <DetailRow label="Relationship" value={verification.respondentRelationship} />
            <DetailRow label="Contact" value={verification.respondentContact} />
            <DetailRow label="Ownership Type" value={verification.ownershipType} />
            <DetailRow label="Verification Date" value={verification.verificationDate} />
          </View>
        )}

        {/* Action Button */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Status: {record.status}</Text>
        </View>
        
        {record.status === 'assigned' && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitVerification}
          >
            <Text style={styles.submitButtonText}>Submit Verification</Text>
          </TouchableOpacity>
        )}
        
        {record.status !== 'assigned' && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>This case cannot be submitted (Status: {record.status})</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#ffe0b2',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  debugText: {
    fontSize: 12,
    color: '#e65100',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  infoText: {
    fontSize: 14,
    color: '#1565c0',
    fontWeight: '500',
  },
  remarksContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  remarksLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 6,
  },
  remarksText: {
    fontSize: 14,
    color: '#c62828',
    lineHeight: 20,
  },
});

export default CaseDetailsScreen;
