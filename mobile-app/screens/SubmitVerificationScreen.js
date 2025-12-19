import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SignatureCanvas from 'react-native-signature-canvas';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot from 'react-native-view-shot';
import { getFastLocation, reverseGeocodeSingleLine, getStaticMapImage } from '../services/locationService';
import { verificationService } from '../services/apiService';
import { uploadToImageKit, uploadMultipleToImageKit } from '../services/imagekitService';

const ownershipOptions = ['Owned', 'Rented', 'PG', 'Hostel'];

const SubmitVerificationScreen = ({ route, navigation }) => {
  const { record } = route.params;
  const [form, setForm] = useState({
    respondentName: '',
    respondentRelationship: '',
    respondentContact: '',
    periodOfStay: '',
    ownershipType: '',
    verificationDate: new Date().toISOString().split('T')[0],
    comments: '',
  });
  const [gps, setGps] = useState({ lat: '', lng: '' });
  const [documents, setDocuments] = useState([]);
  const [housePhotos, setHousePhotos] = useState([]);
  const [selfieWithHouse, setSelfieWithHouse] = useState(null);
  const [candidateWithRespondent, setCandidateWithRespondent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contactError, setContactError] = useState('');
  const [actionType, setActionType] = useState('submitted');
  const [insufficientReason, setInsufficientReason] = useState('');
  const [officerSignature, setOfficerSignature] = useState(null);
  const [respondentSignature, setRespondentSignature] = useState(null);
  const [showOfficerSigModal, setShowOfficerSigModal] = useState(false);
  const [showRespondentSigModal, setShowRespondentSigModal] = useState(false);

  // Watermarking helpers (hidden off-screen renderer)
  const viewShotRef = useRef(null);
  const wmResolverRef = useRef(null);
  const [wmTask, setWmTask] = useState(null); // { uri, gps{lat,lng}, timestamp }
  const [wmSize, setWmSize] = useState({ width: 0, height: 0 });
  const [wmTargetSize, setWmTargetSize] = useState({ width: 0, height: 0 });
  const [wmImageLoaded, setWmImageLoaded] = useState(false);

  useEffect(() => {
    initializeForm();
  }, []);

  const initializeForm = async () => {
    try {
      // Request camera permissions early to avoid prompt delay
      const camPerm = await ImagePicker.requestCameraPermissionsAsync();
      if (camPerm.status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required');
      }

      // Get GPS location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Try last known first (fast), then fallback
        let location = await Location.getLastKnownPositionAsync();
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        }
        setGps({
          lat: location.coords.latitude.toString(),
          lng: location.coords.longitude.toString(),
        });
      } else {
        Alert.alert('Permission Denied', 'Location access is required');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    if (field === 'respondentContact') {
      const digitsOnly = value.replace(/[^0-9]/g, '').slice(0, 10);
      setForm({ ...form, [field]: digitsOnly });
      if (digitsOnly.length && digitsOnly.length !== 10) {
        setContactError('Contact must be exactly 10 digits');
      } else {
        setContactError('');
      }
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  // Save signature (base64 PNG) to file and set state
  const saveSignatureToFile = async (base64Png, who = 'officer') => {
    try {
      console.log('Saving signature for:', who);
      console.log('Base64 length:', base64Png?.length);
      
      const fileName = `${who}_signature_${Date.now()}.png`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      const base64Data = base64Png.replace(/^data:image\/(png|jpg);base64,/, '');
      
      console.log('Writing to:', filePath);
      await FileSystem.writeAsStringAsync(filePath, base64Data, { 
        encoding: 'base64'
      });
      
      const file = { uri: filePath, name: fileName, type: 'image/png' };
      if (who === 'officer') setOfficerSignature(file);
      else setRespondentSignature(file);
      
      console.log('Signature saved successfully');
    } catch (e) {
      console.error('Signature save error:', e);
      Alert.alert('Error', `Failed to save signature: ${e.message}`);
    }
  };

  // Add GPS watermark by composing an off-screen view and capturing it
  const addGPSWatermark = (imageUri, location, addressText = '') => {
    return new Promise((resolve) => {
      wmResolverRef.current = resolve;
      const ts = new Date();
      // Get original image size to compute target render size (cap width at 1200)
      Image.getSize(
        imageUri,
        (w, h) => {
          const maxW = 1200;
          const scale = w > maxW ? maxW / w : 1;
          const targetW = Math.round(w * scale);
          const targetH = Math.round(h * scale);
          setWmSize({ width: w, height: h });
          setWmTargetSize({ width: targetW, height: targetH });
          setWmImageLoaded(false);
          setWmTask({ uri: imageUri, gps: location, timestamp: ts, address: addressText });
        },
        () => {
          // Fallback if size fails
          const targetW = 1000;
          const targetH = 1500;
          setWmSize({ width: targetW, height: targetH });
          setWmTargetSize({ width: targetW, height: targetH });
          setWmImageLoaded(false);
          setWmTask({ uri: imageUri, gps: location, timestamp: new Date(), address: addressText });
        }
      );
    });
  };

  // When image finishes loading inside the hidden renderer, capture and resolve
  useEffect(() => {
    const captureIfReady = async () => {
      if (!wmTask || !wmImageLoaded || !viewShotRef.current) return;
      try {
        const capturedUri = await viewShotRef.current.capture();
        const result = {
          uri: capturedUri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          gpsLat: wmTask.gps?.lat,
          gpsLng: wmTask.gps?.lng,
          timestamp: wmTask.timestamp?.toISOString?.() || new Date().toISOString(),
          address: wmTask.address || '',
        };
        // Clear task before resolving
        setWmTask(null);
        setWmImageLoaded(false);
        wmResolverRef.current && wmResolverRef.current(result);
      } catch (e) {
        console.warn('Watermark capture failed, returning original:', e?.message);
        const fallback = {
          uri: wmTask?.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          gpsLat: wmTask?.gps?.lat,
          gpsLng: wmTask?.gps?.lng,
          timestamp: new Date().toISOString(),
          address: wmTask?.address || '',
        };
        setWmTask(null);
        setWmImageLoaded(false);
        wmResolverRef.current && wmResolverRef.current(fallback);
      }
    };
    captureIfReady();
  }, [wmTask, wmImageLoaded]);

  // Capture photo with camera and add GPS metadata (non-blocking for camera open)
  const capturePhotoWithGPS = async (setter, isMultiple = false) => {
    try {
      // Launch camera immediately to avoid delay
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Get fastest possible location without blocking camera open
        let currentGPS = { lat: gps.lat, lng: gps.lng };
        try {
          const loc = await getFastLocation();
          if (loc?.coords) {
            currentGPS = {
              lat: loc.coords.latitude.toString(),
              lng: loc.coords.longitude.toString(),
            };
            setGps(currentGPS);
          }
        } catch {}

        // Reverse geocode and static map
        const address = await reverseGeocodeSingleLine(currentGPS.lat, currentGPS.lng);
        const mapLocalUri = await getStaticMapImage(currentGPS.lat, currentGPS.lng, { zoom: 16, width: 600, height: 400 });

        const photoWithGPS = await addGPSWatermark(result.assets[0].uri, currentGPS, address);
        photoWithGPS.address = address;
        photoWithGPS.mapLocalUri = mapLocalUri;

        if (isMultiple) {
          setter(prev => [...prev, photoWithGPS]);
        } else {
          setter(photoWithGPS);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  // Pick image from gallery (for documents only)
  const pickImageFromGallery = async (setter, isMultiple = false) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: isMultiple,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Capture location/address/static map at selection time
        let currentGPS = { lat: gps.lat, lng: gps.lng };
        try {
          const loc = await getFastLocation();
          if (loc?.coords) {
            currentGPS = {
              lat: loc.coords.latitude.toString(),
              lng: loc.coords.longitude.toString(),
            };
            setGps(currentGPS);
          }
        } catch {}
        const address = await reverseGeocodeSingleLine(currentGPS.lat, currentGPS.lng);
        const mapLocalUri = await getStaticMapImage(currentGPS.lat, currentGPS.lng, { zoom: 16, width: 600, height: 400 });

        if (isMultiple) {
          const images = result.assets.map(asset => ({
            uri: asset.uri,
            name: asset.fileName || `document_${Date.now()}.jpg`,
            type: asset.type || 'image/jpeg',
            gpsLat: currentGPS.lat,
            gpsLng: currentGPS.lng,
            timestamp: new Date().toISOString(),
            address,
            mapLocalUri,
          }));
          setter(prev => [...prev, ...images]);
        } else {
          setter({
            uri: result.assets[0].uri,
            name: result.assets[0].fileName || `document_${Date.now()}.jpg`,
            type: result.assets[0].type || 'image/jpeg',
            gpsLat: currentGPS.lat,
            gpsLng: currentGPS.lng,
            timestamp: new Date().toISOString(),
            address,
            mapLocalUri,
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateForm = () => {
    if (!form.verificationDate) {
      Alert.alert('Error', 'Verification date is required');
      return false;
    }
    if (!form.ownershipType) {
      Alert.alert('Error', 'Ownership type is required');
      return false;
    }
    if (!form.respondentContact || form.respondentContact.length !== 10) {
      Alert.alert('Error', 'Respondent contact must be exactly 10 digits');
      return false;
    }
    if (!selfieWithHouse) {
      Alert.alert('Error', 'Selfie Photo with House is required');
      return false;
    }
    if (!candidateWithRespondent) {
      Alert.alert('Error', 'Candidate with Respondent Photo is required');
      return false;
    }
    if (actionType === 'insufficient' && !insufficientReason.trim()) {
      Alert.alert('Error', 'Insufficient Reason is required for insufficient cases');
      return false;
    }
    if (!officerSignature) {
      Alert.alert('Error', 'Field Officer Signature is required');
      return false;
    }
    if (!respondentSignature) {
      Alert.alert('Error', 'Respondent Signature is required');
      return false;
    }
    return true;
  };

  // Compress image to reduce payload size
  const compressImage = async (uri) => {
    try {
      console.log('Compressing image:', uri);
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200, height: 1200 } }], // Max 1200x1200
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // 70% quality JPEG
      );
      console.log('Compression complete. Original:', uri, 'Compressed:', result.uri);
      return result.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      // If compression fails, return original
      return uri;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      console.log('=== SUBMISSION STARTING ===');
      
      // Step 1: Test connectivity
      console.log('Testing basic POST connectivity...');
      const testResult = await verificationService.testPost();
      console.log('Test result:', testResult);
      
      if (!testResult.success) {
        Alert.alert('Connection Error', 'Cannot reach server. Please check your WiFi connection and try again.');
        setSubmitting(false);
        return;
      }
      
      console.log('Connection OK, uploading images to ImageKit...');
      
      // Step 2: Upload all images to ImageKit in parallel
      const imagekitUrls = {};
      
      try {
        // Upload documents
        if (documents.length > 0) {
          console.log(`[ImageKit] Uploading ${documents.length} documents...`);
          const docFiles = documents.map((doc) => ({ 
            uri: doc.uri, 
            name: doc.name || `doc_${Date.now()}.jpg` 
          }));
          imagekitUrls.documents = await uploadMultipleToImageKit(docFiles, 'documents');
          console.log('[ImageKit] Documents uploaded:', imagekitUrls.documents);

          // Upload static maps for documents, if present
          const docMapFiles = documents.map((doc, idx) => doc.mapLocalUri ? { uri: doc.mapLocalUri, name: `doc_map_${idx}_${Date.now()}.png` } : null).filter(Boolean);
          imagekitUrls.documentsMaps = docMapFiles.length ? await uploadMultipleToImageKit(docMapFiles, 'maps') : [];
        }

        // Upload house photos
        if (housePhotos.length > 0) {
          console.log(`[ImageKit] Uploading ${housePhotos.length} photos...`);
          const photoFiles = housePhotos.map((photo, idx) => ({ 
            uri: photo.uri, 
            name: photo.name || `photo_${idx}_${Date.now()}.jpg` 
          }));
          imagekitUrls.photos = await uploadMultipleToImageKit(photoFiles, 'photos');
          console.log('[ImageKit] Photos uploaded:', imagekitUrls.photos);

          // Upload static maps for house photos
          const mapFiles = housePhotos.map((photo, idx) => photo.mapLocalUri ? { uri: photo.mapLocalUri, name: `photo_map_${idx}_${Date.now()}.png` } : null).filter(Boolean);
          imagekitUrls.photosMaps = mapFiles.length ? await uploadMultipleToImageKit(mapFiles, 'maps') : [];
        }

        // Upload selfie with house
        if (selfieWithHouse?.uri) {
          console.log('[ImageKit] Uploading selfie with house...');
          imagekitUrls.selfieWithHouse = await uploadToImageKit(
            selfieWithHouse.uri,
            `selfie_${Date.now()}.jpg`,
            'selfies'
          );
          console.log('[ImageKit] Selfie uploaded:', imagekitUrls.selfieWithHouse);

          if (selfieWithHouse.mapLocalUri) {
            imagekitUrls.selfieWithHouseMap = await uploadToImageKit(
              selfieWithHouse.mapLocalUri,
              `selfie_map_${Date.now()}.png`,
              'maps'
            );
          }
        }

        // Upload candidate with respondent
        if (candidateWithRespondent?.uri) {
          console.log('[ImageKit] Uploading candidate with respondent...');
          imagekitUrls.candidateWithRespondent = await uploadToImageKit(
            candidateWithRespondent.uri,
            `candidate_${Date.now()}.jpg`,
            'candidates'
          );
          console.log('[ImageKit] Candidate photo uploaded:', imagekitUrls.candidateWithRespondent);

          if (candidateWithRespondent.mapLocalUri) {
            imagekitUrls.candidateWithRespondentMap = await uploadToImageKit(
              candidateWithRespondent.mapLocalUri,
              `candidate_map_${Date.now()}.png`,
              'maps'
            );
          }
        }

        // Upload signatures
        if (officerSignature?.uri) {
          console.log('[ImageKit] Uploading officer signature...');
          imagekitUrls.officerSignature = await uploadToImageKit(
            officerSignature.uri,
            `officer_sig_${Date.now()}.png`,
            'signatures'
          );
          console.log('[ImageKit] Officer signature uploaded:', imagekitUrls.officerSignature);
        }

        if (respondentSignature?.uri) {
          console.log('[ImageKit] Uploading respondent signature...');
          imagekitUrls.respondentSignature = await uploadToImageKit(
            respondentSignature.uri,
            `respondent_sig_${Date.now()}.png`,
            'signatures'
          );
          console.log('[ImageKit] Respondent signature uploaded:', imagekitUrls.respondentSignature);
        }

        console.log('[ImageKit] All image uploads complete');
      } catch (uploadError) {
        console.error('[ImageKit] Upload failed:', uploadError.message);
        Alert.alert('Image Upload Failed', uploadError.message || 'Failed to upload images to ImageKit');
        setSubmitting(false);
        return;
      }

      // Step 3: Prepare submission payload with ImageKit URLs
      console.log('Preparing submission with ImageKit URLs...');
      
      // Capture GPS at submission time (per-case) + address + static map
      let submissionGps = { lat: gps.lat, lng: gps.lng };
      try {
        const loc = await getFastLocation();
        if (loc?.coords) {
          submissionGps = {
            lat: loc.coords.latitude.toString(),
            lng: loc.coords.longitude.toString(),
          };
        }
      } catch (e) {
        console.warn('Submit GPS fallback to cached', e?.message);
      }

      const submissionAddress = await reverseGeocodeSingleLine(submissionGps.lat, submissionGps.lng);
      const submissionMapLocal = await getStaticMapImage(submissionGps.lat, submissionGps.lng, { zoom: 16, width: 600, height: 400 });
      let submissionMapUrl = null;
      if (submissionMapLocal) {
        try {
          submissionMapUrl = await uploadToImageKit(
            submissionMapLocal,
            `submission_map_${Date.now()}.png`,
            'maps'
          );
        } catch {}
      }

      // Build JSON payload with ImageKit URLs (not base64)
      const photosMeta = (housePhotos || []).map((p, idx) => ({
        lat: p.gpsLat || '',
        lng: p.gpsLng || '',
        timestamp: p.timestamp || '',
        address: p.address || '',
        mapImageUrl: imagekitUrls.photosMaps?.[idx] || null,
      }));
      const documentsMeta = (documents || []).map((d, idx) => ({
        lat: d.gpsLat || '',
        lng: d.gpsLng || '',
        timestamp: d.timestamp || '',
        address: d.address || '',
        mapImageUrl: imagekitUrls.documentsMaps?.[idx] || null,
      }));
      const payload = {
        ...form,
        action: actionType,
        insufficientReason: actionType === 'insufficient' ? insufficientReason : null,
        submissionGpsLat: submissionGps.lat || '',
        submissionGpsLng: submissionGps.lng || '',
        submissionTimestamp: new Date().toISOString(),
        submissionAddress,
        submissionMapImageUrl: submissionMapUrl,
        // ImageKit URLs instead of local files
        documents: imagekitUrls.documents || [],
        photos: imagekitUrls.photos || [],
        selfieWithHouse: imagekitUrls.selfieWithHouse || null,
        candidateWithRespondent: imagekitUrls.candidateWithRespondent || null,
        officerSignature: imagekitUrls.officerSignature || null,
        respondentSignature: imagekitUrls.respondentSignature || null,
        // Additional metadata (backend may ignore these safely)
        documentsMeta,
        selfieWithHouseMeta: selfieWithHouse ? {
          lat: selfieWithHouse.gpsLat || '',
          lng: selfieWithHouse.gpsLng || '',
          timestamp: selfieWithHouse.timestamp || '',
          address: selfieWithHouse.address || '',
          mapImageUrl: imagekitUrls.selfieWithHouseMap || null,
        } : null,
        candidateWithRespondentMeta: candidateWithRespondent ? {
          lat: candidateWithRespondent.gpsLat || '',
          lng: candidateWithRespondent.gpsLng || '',
          timestamp: candidateWithRespondent.timestamp || '',
          address: candidateWithRespondent.address || '',
          mapImageUrl: imagekitUrls.candidateWithRespondentMap || null,
        } : null,
        photosMeta,
      };

      console.log('Submitting verification with ImageKit URLs...', payload);
      
      // Step 4: Submit verification with ImageKit URLs
      const response = await verificationService.submitVerificationWithImageKitUrls(
        record.id,
        payload
      );

      if (response.data.success) {
        Alert.alert('Success', 'Verification submitted successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', response.data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error config:', error.config);
      console.error('Error message:', error.message);
      const message =
        error.response?.data?.message || error.message || 'Submission failed';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  const FilePickButton = ({ label, file, onPress, required, count }) => (
    <View style={styles.filePicker}>
      <Text style={styles.filePickerLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
        {count > 0 && <Text style={styles.fileCount}> ({count} photo{count > 1 ? 's' : ''})</Text>}
      </Text>
      <TouchableOpacity style={styles.filePickButton} onPress={onPress}>
        <Text style={styles.filePickButtonText}>
          {file || count > 0 ? '📷 Add Photo' : '📷 Capture Photo'}
        </Text>
      </TouchableOpacity>
      {file && (
        <View style={styles.selectedFile}>
          <Image source={{ uri: file.uri }} style={styles.thumbnail} />
          {file.gpsLat && (
            <Text style={styles.gpsInfo}>
              📍 Lat: {parseFloat(file.gpsLat).toFixed(6)}, Lng: {parseFloat(file.gpsLng).toFixed(6)}
            </Text>
          )}
          {file.timestamp && (
            <Text style={styles.timestampInfo}>
              🕐 {new Date(file.timestamp).toLocaleString()}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const SignaturePickButton = ({ label, file, onPress, required }) => (
    <View style={styles.filePicker}>
      <Text style={styles.filePickerLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TouchableOpacity style={styles.filePickButton} onPress={onPress}>
        <Text style={styles.filePickButtonText}>
          {file ? '✏️ Change Signature' : '✏️ Capture Signature'}
        </Text>
      </TouchableOpacity>
      {file && (
        <View style={styles.selectedFile}>
          <Text style={styles.previewLabel}>Signature Preview:</Text>
          <Image source={{ uri: file.uri }} style={styles.signatureThumbnail} />
        </View>
      )}
    </View>
  );

  const DocumentPickButton = ({ label, files, onPress }) => (
    <View style={styles.filePicker}>
      <Text style={styles.filePickerLabel}>
        {label}
        {files.length > 0 && <Text style={styles.fileCount}> ({files.length} document{files.length > 1 ? 's' : ''})</Text>}
      </Text>
      <TouchableOpacity style={styles.filePickButton} onPress={onPress}>
        <Text style={styles.filePickButtonText}>
          {files.length > 0 ? '📄 Add More' : '📄 Select Documents'}
        </Text>
      </TouchableOpacity>
      {files.length > 0 && (
        <View style={styles.documentList}>
          {files.map((file, index) => (
            <View key={index} style={styles.documentItem}>
              <Image source={{ uri: file.uri }} style={styles.documentThumbnail} />
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Case Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Case Information</Text>
          <TextInput
            style={styles.disabledInput}
            value={record.caseNumber}
            editable={false}
          />
          <TextInput
            style={styles.disabledInput}
            value={record.fullName}
            editable={false}
          />
        </View>

        {/* Verification Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Respondent Name"
            value={form.respondentName}
            onChangeText={(text) => handleFormChange('respondentName', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Relationship with Candidate"
            value={form.respondentRelationship}
            onChangeText={(text) => handleFormChange('respondentRelationship', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Respondent Contact"
            value={form.respondentContact}
            onChangeText={(text) => handleFormChange('respondentContact', text)}
            keyboardType="numeric"
            maxLength={10}
          />
          {contactError && <Text style={styles.errorText}>{contactError}</Text>}
          <TextInput
            style={styles.input}
            placeholder="Period of Stay"
            value={form.periodOfStay}
            onChangeText={(text) => handleFormChange('periodOfStay', text)}
          />
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.ownershipType}
              onValueChange={(value) => handleFormChange('ownershipType', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Ownership Type" value="" />
              {ownershipOptions.map((opt) => (
                <Picker.Item key={opt} label={opt} value={opt} />
              ))}
            </Picker>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Verification Date (YYYY-MM-DD)"
            value={form.verificationDate}
            onChangeText={(text) => handleFormChange('verificationDate', text)}
          />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Comments"
            value={form.comments}
            onChangeText={(text) => handleFormChange('comments', text)}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={actionType}
              onValueChange={(value) => setActionType(value)}
              style={styles.picker}
            >
              <Picker.Item label="Submit" value="submitted" />
              <Picker.Item label="Mark as Insufficient" value="insufficient" />
            </Picker>
          </View>
          {actionType === 'insufficient' && (
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Insufficient Reason (required)"
              value={insufficientReason}
              onChangeText={setInsufficientReason}
              multiline
            />
          )}
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note</Text>
          <Text style={styles.sectionNote}>
            The cost of verification is paid by the employer. Please do not pay any cash or kind to the field executive as allowance.
          </Text>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Photo Uploads (with GPS)</Text>
          <Text style={styles.sectionNote}>
            Photos will automatically include location and timestamp
          </Text>
          
          <FilePickButton
            label="Selfie Photo with House"
            file={selfieWithHouse}
            onPress={() => capturePhotoWithGPS(setSelfieWithHouse)}
            required
          />
          
          <FilePickButton
            label="Candidate with Respondent Photo"
            file={candidateWithRespondent}
            onPress={() => capturePhotoWithGPS(setCandidateWithRespondent)}
            required
          />
          
          <FilePickButton
            label="House Photos"
            file={housePhotos[housePhotos.length - 1]}
            count={housePhotos.length}
            onPress={() => capturePhotoWithGPS(setHousePhotos, true)}
          />
          
          {housePhotos.length > 0 && (
            <View style={styles.photoGrid}>
              {housePhotos.map((photo, index) => (
                <View key={index} style={styles.photoGridItem}>
                  <Image source={{ uri: photo.uri }} style={styles.gridThumbnail} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setHousePhotos(prev => prev.filter((_, i) => i !== index))}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Document Uploads</Text>
          <Text style={styles.sectionNote}>
            Upload documents from camera or gallery (JPEG/PNG only)
          </Text>
          
          <DocumentPickButton
            label="Documents"
            files={documents}
            onPress={() => pickImageFromGallery(setDocuments, true)}
          />
        </View>

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Signatures</Text>
          <Text style={styles.sectionNote}>Both signatures are mandatory</Text>

          <SignaturePickButton
            label="Field Officer Signature"
            file={officerSignature}
            onPress={() => setShowOfficerSigModal(true)}
            required
          />
          <SignaturePickButton
            label="Respondent Signature"
            file={respondentSignature}
            onPress={() => setShowRespondentSigModal(true)}
            required
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Verification</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Hidden off-screen renderer for watermarking */}
      {wmTask && (
        <View style={styles.offscreenContainer} pointerEvents="none">
          <ViewShot
            ref={viewShotRef}
            options={{ format: 'jpg', quality: 0.9, result: 'tmpfile' }}
            style={{ width: wmTargetSize.width, height: wmTargetSize.height }}
          >
            <Image
              source={{ uri: wmTask.uri }}
              style={{ width: wmTargetSize.width, height: wmTargetSize.height }}
              onLoadEnd={() => setWmImageLoaded(true)}
              resizeMode="cover"
            />
            <View style={styles.watermarkBar}>
              <Text style={styles.watermarkText}>
                Lat: {wmTask.gps?.lat || ''}   Lng: {wmTask.gps?.lng || ''}
              </Text>
              <Text style={styles.watermarkText}>{new Date(wmTask.timestamp).toLocaleString()}</Text>
              {!!wmTask.address && (
                <Text style={styles.watermarkAddress}>{wmTask.address}</Text>
              )}
            </View>
          </ViewShot>
        </View>
      )}

      {/* Signature Modals */}
      <SignatureModal
        visible={showOfficerSigModal}
        title="Field Officer Signature"
        onOK={async (sig) => { 
          await saveSignatureToFile(sig, 'officer'); 
          setShowOfficerSigModal(false); 
        }}
        onClose={() => setShowOfficerSigModal(false)}
      />
      <SignatureModal
        visible={showRespondentSigModal}
        title="Respondent Signature"
        onOK={async (sig) => { 
          await saveSignatureToFile(sig, 'respondent'); 
          setShowRespondentSigModal(false); 
        }}
        onClose={() => setShowRespondentSigModal(false)}
      />
    </ScrollView>
  );
};

// Signature modal components
const SignatureModal = ({ visible, onClose, onOK, title }) => {
  const ref = useRef();

  const handleSignature = (signature) => {
    onOK(signature);
  };

  const handleClear = () => {
    ref.current.clearSignature();
  };

  const handleConfirm = () => {
    ref.current.readSignature();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={sigStyles.modalContainer}>
        <View style={sigStyles.modalContent}>
          <View style={sigStyles.header}>
            <Text style={sigStyles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={sigStyles.closeButton}>
              <Text style={sigStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={sigStyles.canvasContainer}>
            <SignatureCanvas
              ref={ref}
              onOK={handleSignature}
              onEmpty={() => Alert.alert('Error', 'Please provide a signature')}
              descriptionText="Sign here"
              clearText="Clear"
              confirmText="Confirm"
              webStyle={`
                .m-signature-pad {
                  box-shadow: none;
                  border: none;
                  margin: 0;
                }
                .m-signature-pad--body {
                  border: 2px dashed #ddd;
                  border-radius: 4px;
                  background: #fff;
                }
                .m-signature-pad--footer {
                  display: none;
                }
                body,html {
                  width: 100%;
                  height: 100%;
                }
              `}
              autoClear={false}
              backgroundColor="white"
              penColor="black"
            />
          </View>

          <View style={sigStyles.buttonRow}>
            <TouchableOpacity 
              style={[sigStyles.button, sigStyles.clearButton]} 
              onPress={handleClear}
            >
              <Text style={sigStyles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[sigStyles.button, sigStyles.confirmButton]} 
              onPress={handleConfirm}
            >
              <Text style={sigStyles.confirmButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const sigStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  canvasContainer: {
    height: 300,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#667eea',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

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
  sectionNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  disabledInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    color: '#666',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
  },
  filePicker: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filePickerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  fileCount: {
    color: '#667eea',
    fontWeight: 'bold',
  },
  required: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  filePickButton: {
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  filePickButtonText: {
    color: '#667eea',
    fontSize: 13,
    fontWeight: '600',
  },
  selectedFile: {
    alignItems: 'center',
    marginTop: 8,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 6,
    marginBottom: 6,
  },
  signatureThumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  gpsInfo: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 4,
  },
  timestampInfo: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  photoGridItem: {
    width: '31%',
    marginRight: '2.33%',
    marginBottom: 8,
    position: 'relative',
  },
  gridThumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 6,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  documentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  documentItem: {
    width: '31%',
    marginRight: '2.33%',
    marginBottom: 8,
  },
  documentThumbnail: {
    width: '100%',
    height: 80,
    borderRadius: 6,
  },
  fileName: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  offscreenContainer: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    opacity: 0,
  },
  watermarkBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  watermarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  watermarkAddress: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
});

export default SubmitVerificationScreen;
