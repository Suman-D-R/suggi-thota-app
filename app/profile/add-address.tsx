import {
  IconArrowLeft,
  IconBuilding,
  IconCurrentLocation,
  IconHome,
  IconMap,
  IconMapPin,
  IconSearch,
  IconUser,
  IconX,
} from '@tabler/icons-react-native';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Address, useLocationStore } from '../../store/locationStore';

// Try to import react-native-maps, fallback if not available
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default || maps.MapView;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (error) {
  console.warn('react-native-maps not available, using fallback');
}

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  label?: string;
}

export default function AddAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!params.id;
  const mapRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const { addAddress, updateAddress, addresses } = useLocationStore();

  const existingAddress = isEditMode
    ? addresses.find((addr) => addr.id === params.id)
    : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [flatHouseNo, setFlatHouseNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work'>('Home');
  const [region, setRegion] = useState({
    latitude: 28.7041, // Default to Delhi
    longitude: 77.1025,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (isEditMode && existingAddress) {
      // Pre-populate form fields with existing address data
      setAddressType(existingAddress.label as 'Home' | 'Work');
      // Parse the address to extract flat/house no if possible
      const addressParts = existingAddress.address.split(', ');
      if (addressParts.length > 1) {
        setFlatHouseNo(addressParts[0]);
        // Set the rest as the location address
        const locationAddress = addressParts.slice(1).join(', ');
        setSelectedLocation({
          latitude: 28.7041, // Default, could be enhanced to store coordinates
          longitude: 77.1025,
          address: locationAddress,
          label: existingAddress.label,
        });
      } else {
        setSelectedLocation({
          latitude: 28.7041,
          longitude: 77.1025,
          address: existingAddress.address,
          label: existingAddress.label,
        });
      }
      // Open the modal automatically in edit mode
      setShowAddressModal(true);
    }
  }, [isEditMode, existingAddress]);

  useEffect(() => {
    if (!isEditMode) {
      requestLocationPermission();
    }
  }, [isEditMode]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );

      await reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Unable to get your current location');
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setIsLoading(true);
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        const addressString = [
          address.street,
          address.streetNumber,
          address.district,
          address.city,
          address.region,
          address.country,
        ]
          .filter(Boolean)
          .join(' - ');

        setSelectedLocation({
          latitude,
          longitude,
          address: addressString || `${latitude}, ${longitude}`,
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setSelectedLocation({
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setRegion({
      ...region,
      latitude,
      longitude,
    });
    reverseGeocode(latitude, longitude);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      const geocode = await Location.geocodeAsync(searchQuery);

      if (geocode.length > 0) {
        const { latitude, longitude } = geocode[0];

        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );

        await reverseGeocode(latitude, longitude);
      } else {
        Alert.alert(
          'Not Found',
          'Location not found. Please try a different search.'
        );
      }
    } catch (error) {
      console.error('Error geocoding:', error);
      Alert.alert('Error', 'Unable to search location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddressDetails = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    setShowAddressModal(true);
  };

  const handleSaveAddress = () => {
    if (!flatHouseNo.trim()) {
      Alert.alert('Error', 'Please enter flat/house no/building name');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!mobileNumber.trim() || mobileNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (!selectedLocation) {
      return;
    }

    const fullAddress = `${flatHouseNo}, ${selectedLocation.address}`;

    if (isEditMode && params.id) {
      // Update existing address
      updateAddress(params.id, {
        label: addressType,
        address: fullAddress,
      });
    } else {
      // Add new address
      const newAddress: Address = {
        id: Date.now().toString(),
        label: addressType,
        address: fullAddress,
        isDefault: false,
      };
      addAddress(newAddress);
    }

    setShowAddressModal(false);
    // Reset form
    setFlatHouseNo('');
    setFullName('');
    setMobileNumber('');
    setAlternatePhone('');
    setAddressType('Home');
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconArrowLeft size={24} color='#333' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit address' : 'Add new address'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconSearch size={20} color='#666' style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder='Search by area, street name...'
          placeholderTextColor='#999'
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType='search'
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <IconX size={20} color='#666' />
          </TouchableOpacity>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {MapView ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            region={region}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && Marker && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                pinColor='#FF0000'
              />
            )}
          </MapView>
        ) : (
          <View style={[styles.map, styles.mapPlaceholder]}>
            <IconMap size={64} color='#ccc' />
            <Text style={styles.mapPlaceholderText}>
              Map requires a development build
            </Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Please build the app to enable map functionality
            </Text>
          </View>
        )}

        {/* Tooltip */}
        {selectedLocation && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              Place pin on the exact location
            </Text>
          </View>
        )}

        {/* Use Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          <IconCurrentLocation size={20} color='#4CAF50' />
          <Text style={styles.currentLocationText}>
            Use my current location
          </Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size='large' color='#4CAF50' />
          </View>
        )}
      </View>

      {/* Address Confirmation Section */}
      <View style={styles.addressSection}>
        <Text style={styles.deliverToText}>Deliver to</Text>
        {selectedLocation ? (
          <View style={styles.addressCard}>
            <IconUser size={20} color='#666' style={styles.personIcon} />
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>
                {selectedLocation.label || 'Selected Location'}
              </Text>
              <Text style={styles.addressText}>{selectedLocation.address}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.noAddressCard}>
            <Text style={styles.noAddressText}>
              Select a location on the map or search for an address
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            !selectedLocation && styles.addButtonDisabled,
          ]}
          onPress={handleAddAddressDetails}
          disabled={!selectedLocation || isLoading}
        >
          <Text style={styles.addButtonText}>
            {isEditMode ? 'Edit address details' : 'Add address details'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Address Details Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setShowAddressModal(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 40}
          >
            {/* Modal Header - Sticky */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Deliver to</Text>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                style={styles.closeButton}
              >
                <IconX size={24} color='#333' />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
              contentContainerStyle={styles.scrollContent}
            >
              {/* Selected Address Card */}
              {selectedLocation && (
                <View style={styles.selectedAddressCard}>
                  <IconMapPin
                    size={20}
                    color='#666'
                    style={styles.locationIcon}
                  />
                  <View style={styles.selectedAddressContent}>
                    <Text style={styles.selectedAddressLabel}>
                      {selectedLocation.address.split(' - ')[0] ||
                        'Selected Location'}
                    </Text>
                    <Text style={styles.selectedAddressText}>
                      {selectedLocation.address}
                    </Text>
                  </View>
                </View>
              )}

              {/* Form Fields */}
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>
                  Flat / House no. / Building name{' '}
                  <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='Flat / House no. / Building name'
                  placeholderTextColor='#999'
                  value={flatHouseNo}
                  onChangeText={setFlatHouseNo}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }, 100);
                  }}
                />

                <Text style={styles.inputLabel}>
                  Enter your full name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='Enter your full name'
                  placeholderTextColor='#999'
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({
                        y: 100,
                        animated: true,
                      });
                    }, 100);
                  }}
                />

                <Text style={styles.inputLabel}>
                  10-digit mobile number <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='10-digit mobile number'
                  placeholderTextColor='#999'
                  value={mobileNumber}
                  onChangeText={(text) => {
                    // Only allow digits and limit to 10
                    const digits = text.replace(/[^0-9]/g, '');
                    if (digits.length <= 10) {
                      setMobileNumber(digits);
                    }
                  }}
                  keyboardType='phone-pad'
                  maxLength={10}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({
                        y: 200,
                        animated: true,
                      });
                    }, 100);
                  }}
                />

                <Text style={styles.inputLabel}>
                  Alternate phone number (Optional)
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='Alternate phone number (Optional)'
                  placeholderTextColor='#999'
                  value={alternatePhone}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, '');
                    if (digits.length <= 10) {
                      setAlternatePhone(digits);
                    }
                  }}
                  keyboardType='phone-pad'
                  maxLength={10}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({
                        y: 300,
                        animated: true,
                      });
                    }, 100);
                  }}
                />

                {/* Type of Address */}
                <Text style={styles.inputLabel}>Type of address</Text>
                <View style={styles.addressTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.addressTypeButton,
                      addressType === 'Home' && styles.addressTypeButtonActive,
                    ]}
                    onPress={() => setAddressType('Home')}
                  >
                    <IconHome
                      size={20}
                      color={addressType === 'Home' ? '#4CAF50' : '#666'}
                    />
                    <Text
                      style={[
                        styles.addressTypeText,
                        addressType === 'Home' && styles.addressTypeTextActive,
                      ]}
                    >
                      Home
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addressTypeButton,
                      addressType === 'Work' && styles.addressTypeButtonActive,
                    ]}
                    onPress={() => setAddressType('Work')}
                  >
                    <IconBuilding
                      size={20}
                      color={addressType === 'Work' ? '#4CAF50' : '#666'}
                    />
                    <Text
                      style={[
                        styles.addressTypeText,
                        addressType === 'Work' && styles.addressTypeTextActive,
                      ]}
                    >
                      Work
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveAddressButton}
                onPress={handleSaveAddress}
              >
                <Text style={styles.saveAddressButtonText}>
                  {isEditMode ? 'Update address' : 'Save address'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholderText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  mapPlaceholderSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  tooltip: {
    position: 'absolute',
    top: 20,
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deliverToText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  noAddressCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  personIcon: {
    marginRight: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  noAddressText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '60%',
  },
  modalScrollView: {
    flexGrow: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 150,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  selectedAddressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  locationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  selectedAddressContent: {
    flex: 1,
  },
  selectedAddressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedAddressText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#FF0000',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  addressTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  addressTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    gap: 8,
  },
  addressTypeButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  addressTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  addressTypeTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  saveAddressButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveAddressButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
