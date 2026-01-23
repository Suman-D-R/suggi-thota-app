import { Ionicons } from '@expo/vector-icons';
import { IconMapPinFilled } from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocationStore } from '../store/locationStore';
import { useUserStore } from '../store/userStore';
import Drawer from './Drawer';

const COLORS = {
  primary: '#059669', // Modern Emerald
  primarySoft: '#ECFDF5',
  textDark: '#111827',
  textGray: '#6B7280',
  textLight: '#9CA3AF',
  danger: '#EF4444',
  bg: '#FFFFFF',
  cardBg: '#FFFFFF',
  border: '#F3F4F6',
};

export default function LocationHeader() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const addresses = useLocationStore((state) => state.addresses);
  const selectedAddressId = useLocationStore(
    (state) => state.selectedAddressId
  );
  const selectAddress = useLocationStore((state) => state.selectAddress);
  const initializeLocation = useLocationStore(
    (state) => state.initializeLocation
  );
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;

  // Initialize location if no addresses are available
  useEffect(() => {
    if (addresses.length === 0) {
      initializeLocation();
    }
  }, [addresses.length, initializeLocation]);

  const handleHeaderPress = () => {
    // If user is not logged in, redirect directly to add address page
    if (!isLoggedIn) {
      router.push('/profile/add-address');
      return;
    }
    // If logged in, open the drawer as usual
    openDrawer();
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    setIsDrawerOpen(false);
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

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.6}
          onPress={handleHeaderPress}
        >
          <Ionicons name='location' size={16} color={COLORS.danger} />
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
            <Ionicons name='chevron-down' size={14} color={COLORS.textDark} />
          </View>
        </TouchableOpacity>
      </View>

      <Drawer
        visible={isDrawerOpen}
        onClose={handleClose}
        title='Choose Delivery Location'
        maxHeight='90%'
      >
        <ScrollView
          style={styles.addressesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 0,
          }}
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
              <IconMapPinFilled
                size={16}
                color={
                  selectedAddress?.id === address.id ? COLORS.primary : COLORS.danger
                }
                style={styles.addressIcon}
              />
              <View style={styles.addressDetails}>
                <View style={styles.labelRow}>
                  <Text
                    style={[
                      styles.addressLabel,
                      selectedAddress?.id === address.id && styles.selectedText,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {address.label}
                  </Text>
                  {selectedAddress?.id === address.id && (
                    <View style={styles.checkBadge}>
                      <Ionicons name='checkmark' size={12} color='#fff' />
                    </View>
                  )}
                </View>
                {address.street && (
                  <Text
                    style={styles.addressMainText}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                  >
                    {address.street}
                  </Text>
                )}
                <Text
                  style={styles.addressText}
                  numberOfLines={2}
                  ellipsizeMode='tail'
                >
                  {address.address}
                </Text>
                {(address.landmark || address.city || address.pincode) && (
                  <View style={styles.addressMeta}>
                    {address.landmark && (
                      <Text
                        style={styles.addressMetaText}
                        numberOfLines={1}
                        ellipsizeMode='tail'
                      >
                        {address.landmark}
                      </Text>
                    )}
                    {address.city && address.landmark && (
                      <Text style={styles.addressMetaText}> • </Text>
                    )}
                    {address.city && (
                      <Text
                        style={styles.addressMetaText}
                        numberOfLines={1}
                        ellipsizeMode='tail'
                      >
                        {address.city}
                      </Text>
                    )}
                    {address.pincode && (
                      <Text style={styles.addressMetaText}>
                        {' • '}
                        {address.pincode}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.addButton, { marginBottom: insets.bottom }]}
            onPress={handleAddNewAddress}
            activeOpacity={0.8}
          >
            <Ionicons name='add' size={24} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Add New Address</Text>
          </TouchableOpacity>
        </ScrollView>
      </Drawer>
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
    color: COLORS.textDark,
  },
  selectedAddress: {
    fontSize: 12,
    color: COLORS.textGray,
    flexShrink: 1,
  },
  addressesList: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 0,
  },
  selectedItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
  },
  addressIcon: {
    marginRight: 12,
    marginTop: 2,
    flexShrink: 0,
  },
  addressDetails: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexShrink: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    flexShrink: 1,
  },
  selectedText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressMainText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
    flexShrink: 1,
  },
  addressText: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 6,
    lineHeight: 20,
    flexShrink: 1,
  },
  addressMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  addressMetaText: {
    fontSize: 10,
    color: COLORS.textLight,
    flexShrink: 1,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: COLORS.bg,
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
