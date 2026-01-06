import {
  IconCurrentLocation,
  IconMap,
  IconMapPinFilled,
  IconSearch,
  IconX,
} from '@tabler/icons-react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useLocationStore } from '../../store/locationStore';
import { useUserStore } from '../../store/userStore';

let MapView: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default || maps.MapView;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (e) {
  console.warn('Maps not available');
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  street?: string;
  district?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  name?: string;
}

export default function AddAddressScreen() {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const geocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUserInteractingRef = useRef(false);
  const isProgrammaticMoveRef = useRef(false);
  const pendingSearchCoordinatesRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const { addAddress, updateAddress, createAddress, addresses, removeAddress } =
    useLocationStore();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [flatHouseNo, setFlatHouseNo] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [addressType, setAddressType] = useState<'Home' | 'Work'>('Home');

  const [region, setRegion] = useState({
    latitude: 28.7041,
    longitude: 77.1025,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') getCurrentLocation();
  };

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      isProgrammaticMoveRef.current = true;
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);

      // Clear any pending geocode calls
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }

      reverseGeocode(latitude, longitude);

      // Reset flag after animation completes
      setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 1000);
    } catch {
      Alert.alert('Error', 'Unable to fetch location');
      isProgrammaticMoveRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setIsLoading(true);
      const res = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (res.length) {
        const a = res[0];
        // Create full address string
        const address = [a.name, a.street, a.city, a.region, a.country]
          .filter(Boolean)
          .join(', ');

        setSelectedLocation({
          latitude,
          longitude,
          address,
          street: a.street || a.name || undefined,
          district: a.district || a.subregion || undefined,
          city: a.city || undefined,
          region: a.region || undefined,
          postalCode: a.postalCode || undefined,
          country: a.country || undefined,
          name: a.name || undefined,
        });

        // Pre-fill street and city from location if available
        if (a.street || a.name) {
          setStreet(a.street || a.name || '');
        }
        if (a.city) {
          setCity(a.city);
        }
      }
    } catch {
      setSelectedLocation({
        latitude,
        longitude,
        address: `${latitude}, ${longitude}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegionChangeComplete = (r: any) => {
    setRegion(r);

    // If this is a programmatic move (search, current location), handle it specially
    if (isProgrammaticMoveRef.current && pendingSearchCoordinatesRef.current) {
      // Use the actual region center coordinates from the map for more accurate reverse geocoding
      // This ensures we get the address for the exact center point visible on the map
      reverseGeocode(r.latitude, r.longitude);
      pendingSearchCoordinatesRef.current = null;
      // Reset flag after a short delay to ensure reverse geocoding completes
      setTimeout(() => {
        isProgrammaticMoveRef.current = false;
      }, 100);
      return;
    }

    // Skip if this is still a programmatic move (current location, etc.)
    if (isProgrammaticMoveRef.current) {
      return;
    }

    // Clear any pending geocode calls
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Debounce geocoding to prevent flickering during zoom/pan
    geocodeTimeoutRef.current = setTimeout(() => {
      // Only geocode if user is not actively interacting
      if (!isUserInteractingRef.current && !isProgrammaticMoveRef.current) {
        reverseGeocode(r.latitude, r.longitude);
      }
    }, 500);
  };

  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const onRegionChange = () => {
    // Mark that user is actively interacting
    isUserInteractingRef.current = true;

    // Clear existing timeout
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }

    // Reset interaction flag after user stops interacting
    interactionTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 300);
  };

  useEffect(() => {
    // Cleanup timeouts on unmount
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  const openDrawer = () => {
    setShowModal(true);
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
    });
  };

  const saveAddress = async () => {
    if (!flatHouseNo || !fullName || mobileNumber.length !== 10) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location');
      return;
    }

    // Check if there's a "Current Location" address that should be updated
    const currentLocationAddress = addresses.find(
      (addr) =>
        addr.id.startsWith('current_') || addr.label === 'Current Location'
    );

    const fullAddress = `${flatHouseNo}, ${selectedLocation.address}`;

    if (isLoggedIn) {
      // User is logged in - sync with backend
      // Ensure all required fields are present
      const streetValue =
        street.trim() || selectedLocation.street || selectedLocation.name || '';
      const cityValue = city.trim() || selectedLocation.city || '';
      const stateValue = selectedLocation.region || '';

      if (!streetValue || !cityValue || !stateValue) {
        Alert.alert(
          'Incomplete Address',
          'Please fill in street, city, and ensure state is available from the selected location.',
          [{ text: 'OK' }]
        );
        return;
      }

      try {
        const addressData = {
          type: addressType.toLowerCase() as 'home' | 'work' | 'other',
          label: addressType,
          street: flatHouseNo ? `${flatHouseNo}, ${streetValue}` : streetValue,
          apartment: flatHouseNo,
          landmark: selectedLocation.district || '',
          city: cityValue,
          state: stateValue,
          country: selectedLocation.country || 'India',
          contactName: fullName,
          contactPhone: mobileNumber,
          coordinates: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          },
          isDefault: currentLocationAddress?.isDefault || false,
        };

        // If current location address exists, we should update it on server
        // But since it's a local address (id starts with current_), we'll create a new one
        // and optionally remove the old one
        if (
          currentLocationAddress &&
          currentLocationAddress.id.startsWith('current_')
        ) {
          // Create new address on server
          await createAddress(addressData);
          // Remove the old current location address
          removeAddress(currentLocationAddress.id);
        } else {
          // Create new address
          await createAddress(addressData);
        }
      } catch (error) {
        console.error('Failed to save address:', error);
        Alert.alert('Error', 'Failed to save address. Please try again.');
        return;
      }
    } else {
      // User is not logged in - update current location or add new
      if (currentLocationAddress) {
        // Update the current location address
        updateAddress(currentLocationAddress.id, {
          label: addressType,
          address: fullAddress,
          street:
            street.trim() ||
            selectedLocation.street ||
            selectedLocation.name ||
            '',
          city: city.trim() || selectedLocation.city || '',
          state: selectedLocation.region || '',
          country: selectedLocation.country || 'India',
          contactName: fullName,
          contactPhone: mobileNumber,
          coordinates: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          },
        });
      } else {
        // Add new address
        addAddress({
          id: Date.now().toString(),
          label: addressType,
          address: fullAddress,
          street:
            street.trim() ||
            selectedLocation.street ||
            selectedLocation.name ||
            '',
          city: city.trim() || selectedLocation.city || '',
          state: selectedLocation.region || '',
          country: selectedLocation.country || 'India',
          contactName: fullName,
          contactPhone: mobileNumber,
          coordinates: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          },
          isDefault: false,
        });
      }
    }

    closeDrawer();
    router.back();
  };

  const handleConfirmLocation = () => {
    if (!isLoggedIn) {
      // Update current location address if it exists
      if (!selectedLocation) {
        Alert.alert('Error', 'Please select a location');
        return;
      }

      const currentLocationAddress = addresses.find(
        (addr) =>
          addr.id.startsWith('current_') || addr.label === 'Current Location'
      );

      if (currentLocationAddress) {
        // Update the current location address with the selected location
        updateAddress(currentLocationAddress.id, {
          address: selectedLocation.address,
          street: selectedLocation.street || selectedLocation.name || '',
          city: selectedLocation.city || '',
          state: selectedLocation.region || '',
          pincode: selectedLocation.postalCode || '',
          country: selectedLocation.country || 'India',
          coordinates: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          },
        });
      } else {
        // Create a new address from the selected location
        const fullAddress = selectedLocation.address;
        addAddress({
          id: `current_${Date.now()}`,
          label: 'Current Location',
          address: fullAddress,
          street: selectedLocation.street || selectedLocation.name || '',
          city: selectedLocation.city || '',
          state: selectedLocation.region || '',
          pincode: selectedLocation.postalCode || '',
          country: selectedLocation.country || 'India',
          coordinates: {
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          },
          isDefault: true,
        });
      }
      router.push('/(tabs)/home');
    } else {
      openDrawer();
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <View style={styles.container}>
      <Header title='Add new address' showBack />

      {/* Map */}
      <View style={styles.mapContainer}>
        {MapView ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            onRegionChange={onRegionChange}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <IconMap size={60} color='#ccc' />
            <Text>Build required for maps</Text>
          </View>
        )}

        {/* Search Bar - Absolutely positioned on top of map */}
        <View style={styles.searchBox}>
          <IconSearch size={20} color='#16a34a' />
          <TextInput
            style={styles.searchInput}
            placeholder='Search area, street...'
            placeholderTextColor='#999'
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={async () => {
              try {
                setIsLoading(true);
                const geo = await Location.geocodeAsync(searchQuery);
                if (geo.length) {
                  isProgrammaticMoveRef.current = true;
                  const { latitude, longitude } = geo[0];
                  const r = {
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  };

                  // Clear any pending geocode calls
                  if (geocodeTimeoutRef.current) {
                    clearTimeout(geocodeTimeoutRef.current);
                  }

                  // Store coordinates to trigger reverse geocoding in onRegionChangeComplete
                  // onRegionChangeComplete will use the actual map center coordinates for accurate reverse geocoding
                  pendingSearchCoordinatesRef.current = { latitude, longitude };

                  // Animate map to the location
                  // onRegionChangeComplete will be called when animation finishes and handle reverse geocoding
                  mapRef.current?.animateToRegion(r, 800);
                } else {
                  setIsLoading(false);
                  Alert.alert(
                    'Not Found',
                    'Location not found. Please try a different search.'
                  );
                }
              } catch (error) {
                console.error('Search geocoding error:', error);
                Alert.alert(
                  'Error',
                  'Unable to find the location. Please try again.'
                );
                setIsLoading(false);
                pendingSearchCoordinatesRef.current = null;
                isProgrammaticMoveRef.current = false;
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconX size={18} color='#999' />
            </TouchableOpacity>
          )}
        </View>

        {/* FIXED CENTER PIN */}
        <View pointerEvents='none' style={styles.centerPin}>
          {/* Red shining ball on top */}
          <View style={styles.pinBall}>
            <View style={styles.pinBallShine} />
          </View>
          {/* Black line below */}
          <View style={styles.pinLine} />
        </View>

        <TouchableOpacity
          style={styles.currentBtn}
          onPress={getCurrentLocation}
        >
          <IconCurrentLocation size={18} color='#4CAF50' />
          <Text style={styles.currentText}>Use current location</Text>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loader}>
            <ActivityIndicator size='large' color='#4CAF50' />
          </View>
        )}
      </View>

      {/* Bottom */}
      <View
        style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {selectedLocation ? (
          <View style={styles.addressCard}>
            <IconMapPinFilled
              size={16}
              color='#FF0000'
              style={styles.addressIcon}
            />
            <View style={styles.addressDetails}>
              {selectedLocation.street && (
                <Text style={styles.addressMainText}>
                  {selectedLocation.street}
                </Text>
              )}
              <Text style={styles.addressText}>{selectedLocation.address}</Text>
              <View style={styles.addressMeta}>
                {selectedLocation.district && (
                  <Text style={styles.addressMetaText}>
                    {selectedLocation.district}
                  </Text>
                )}
                {selectedLocation.city && selectedLocation.district && (
                  <Text style={styles.addressMetaText}> • </Text>
                )}
                {selectedLocation.city && (
                  <Text style={styles.addressMetaText}>
                    {selectedLocation.city}
                  </Text>
                )}
                {selectedLocation.postalCode && (
                  <Text style={styles.addressMetaText}>
                    {' • '}
                    {selectedLocation.postalCode}
                  </Text>
                )}
              </View>
            </View>
          </View>
        ) : null}

        <TouchableOpacity style={styles.addBtn} onPress={handleConfirmLocation}>
          <Text style={styles.addText}>
            {isLoggedIn ? 'Add address details' : 'Confirm'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Drawer Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType='none'
        onRequestClose={closeDrawer}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <TouchableOpacity
              style={styles.backdropTouch}
              activeOpacity={1}
              onPress={closeDrawer}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity
                onPress={closeDrawer}
                style={styles.closeButton}
              >
                <IconX size={24} color='#FFFFFF' />
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
              style={styles.drawerContent}
            >
              <ScrollView
                contentContainerStyle={{
                  paddingBottom: Math.max(insets.bottom, 24),
                }}
                keyboardShouldPersistTaps='handled'
                keyboardDismissMode='interactive'
                showsVerticalScrollIndicator={true}
              >
                <Text style={[styles.label, { marginTop: 0 }]}>
                  Flat / House *
                </Text>
                <TextInput
                  style={styles.input}
                  value={flatHouseNo}
                  onChangeText={setFlatHouseNo}
                  placeholder='Enter flat/house number'
                  placeholderTextColor='#999'
                  returnKeyType='next'
                />

                <Text style={styles.label}>Street *</Text>
                <TextInput
                  style={styles.input}
                  value={street}
                  onChangeText={setStreet}
                  placeholder='Enter street address'
                  placeholderTextColor='#999'
                  returnKeyType='next'
                />

                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder='Enter city'
                  placeholderTextColor='#999'
                  returnKeyType='next'
                />

                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder='Enter your full name'
                  placeholderTextColor='#999'
                  returnKeyType='next'
                />

                <Text style={styles.label}>Mobile *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType='number-pad'
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={(t) =>
                    setMobileNumber(t.replace(/[^0-9]/g, ''))
                  }
                  placeholder='Enter 10-digit mobile number'
                  placeholderTextColor='#999'
                  returnKeyType='done'
                />

                <View style={styles.typeRow}>
                  {['Home', 'Work'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeBtn,
                        addressType === t && styles.typeActive,
                      ]}
                      onPress={() => setAddressType(t as any)}
                    >
                      <Text
                        style={[
                          styles.typeBtnText,
                          addressType === t && styles.typeBtnTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={saveAddress}>
                  <Text style={styles.saveText}>Save address</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  searchBox: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    height: Platform.select({
      ios: 48,
      android: 42,
      default: 44,
    }),
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: -1,
    marginTop: -40,
  },
  pinBall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    borderWidth: 3,
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -1,
    zIndex: 1000,
  },
  pinBallShine: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 0,
    left: 3,
  },
  pinLine: {
    width: 2,
    height: 40,
    backgroundColor: '#000',
  },

  currentBtn: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 4,
  },
  currentText: { marginLeft: 6, color: '#4CAF50' },

  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  bottom: {
    padding: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#F8F9FA',
  },
  addressCard: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 0.2,
    borderColor: '#E0E0E0',
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressDetails: {
    flex: 1,
  },
  addressMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  addressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  addressMetaText: {
    fontSize: 10,
    color: '#999',
  },
  addBtn: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addText: { color: '#fff', fontWeight: '600' },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  backdropTouch: {
    flex: 1,
  },
  drawer: {
    backgroundColor: '#FBFBFB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingTop: 20,
    position: 'relative',
    flex: 1,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: -46,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5B5B5B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flex: 1,
  },

  label: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 14,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#1a1a1a',
  },

  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  typeBtn: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#E0E0E0',
  },
  typeActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  typeBtnTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },

  saveBtn: {
    backgroundColor: '#4CAF50',
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
