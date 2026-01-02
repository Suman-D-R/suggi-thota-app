import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocationStore } from '../store/locationStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LocationHeader() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const addresses = useLocationStore((state) => state.addresses);
  const selectedAddressId = useLocationStore(
    (state) => state.selectedAddressId
  );
  const selectAddress = useLocationStore((state) => state.selectAddress);
  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;

  const openDrawer = () => {
    setIsDrawerOpen(true);
    // Reset value just in case
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  };

  const handleAddressSelect = (id: string) => {
    selectAddress(id);
    handleClose();
  };

  const handleAddNewAddress = () => {
    handleClose();
    // Small delay to allow animation to start/finish before navigating
    setTimeout(() => {
      router.push('/profile/add-address');
    }, 200);
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
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.6}
          onPress={openDrawer}
        >
          <Ionicons name='location' size={16} color='#f23737ff' />
          <View style={styles.headerTextContainer}>
            <Text style={styles.selectedLabel}>
              {selectedAddress?.label || 'Home'}
            </Text>
            <Text
              style={styles.selectedAddress}
              numberOfLines={1}
              ellipsizeMode='tail'
            >
              {selectedAddress?.address || 'Select an address'}
            </Text>
            <Ionicons name='chevron-down' size={14} color='#1a1a1a' />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isDrawerOpen}
        transparent
        animationType='none'
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          >
            <TouchableOpacity
              style={styles.backdropTouch}
              activeOpacity={1}
              onPress={handleClose}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateY }],
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View style={styles.drawerHandle} />

            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Choose Delivery Location</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Ionicons name='close' size={20} color='#666' />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.addressesList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {addresses.map((address) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressItem,
                    selectedAddress?.id === address.id && styles.selectedItem,
                  ]}
                  onPress={() => handleAddressSelect(address.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.addressIcon,
                      selectedAddress?.id === address.id && styles.selectedIcon,
                    ]}
                  >
                    <Ionicons
                      name={
                        address.label === 'Home'
                          ? 'home'
                          : address.label === 'Work'
                          ? 'briefcase'
                          : 'location'
                      }
                      size={20}
                      color={
                        selectedAddress?.id === address.id ? '#16a34a' : '#666'
                      }
                    />
                  </View>

                  <View style={styles.addressContent}>
                    <View style={styles.labelRow}>
                      <Text
                        style={[
                          styles.addressLabel,
                          selectedAddress?.id === address.id &&
                            styles.selectedText,
                        ]}
                      >
                        {address.label}
                      </Text>
                      {selectedAddress?.id === address.id && (
                        <View style={styles.checkBadge}>
                          <Ionicons name='checkmark' size={12} color='#fff' />
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressText} numberOfLines={2}>
                      {address.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddNewAddress}
                activeOpacity={0.8}
              >
                <Ionicons name='add' size={24} color='#16a34a' />
                <Text style={styles.addButtonText}>Add New Address</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-start',
  },
  addressTextWrapper: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  selectedAddress: {
    fontSize: 12,
    color: '#666',
    flexShrink: 1,
  },
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },
  addressesList: {
    paddingHorizontal: 24,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  selectedItem: {
    borderColor: '#16a34a',
    backgroundColor: '#F0FDF4',
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedIcon: {
    backgroundColor: '#fff',
  },
  addressContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectedText: {
    color: '#16a34a',
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
  },
});
