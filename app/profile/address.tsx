import {
  IconBriefcase,
  IconCirclePlus,
  IconEdit,
  IconHome,
  IconMapPin,
  IconTrash,
} from '@tabler/icons-react-native';
import { useRouter } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import { useLocationStore } from '../../store/locationStore';

export default function AddressScreen() {
  const router = useRouter();
  const { addresses, removeAddress, selectAddress } = useLocationStore();
  const selectedAddressId = useLocationStore(
    (state) => state.selectedAddressId
  );
  const selectedAddress =
    addresses.find((addr) => addr.id === selectedAddressId) || null;

  const handleDelete = (id: string, label: string) => {
    Alert.alert('Delete Address', `Are you sure you want to delete ${label}?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeAddress(id),
      },
    ]);
  };

  const handleSetDefault = (id: string) => {
    selectAddress(id);
  };

  const handleAddAddress = () => {
    router.push('/profile/add-address');
  };

  const handleEditAddress = (id: string) => {
    router.push(`/profile/add-address?id=${id}`);
  };

  const getAddressIcon = (label: string) => {
    if (label === 'Home') return IconHome;
    if (label === 'Work') return IconBriefcase;
    return IconMapPin;
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconMapPin size={64} color='#ccc' />
            <Text style={styles.emptyText}>No addresses saved</Text>
            <Text style={styles.emptySubtext}>
              Add your first address to get started
            </Text>
          </View>
        ) : (
          <View style={styles.addressList}>
            {addresses.map((address) => {
              const isSelected = selectedAddress?.id === address.id;
              return (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    isSelected && styles.selectedAddressCard,
                  ]}
                  onPress={() => handleSetDefault(address.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.addressHeader}>
                    <View style={styles.addressLabelContainer}>
                      <View style={styles.iconContainer}>
                        {(() => {
                          const IconComponent = getAddressIcon(address.label);
                          return <IconComponent size={20} color='#4CAF50' />;
                        })()}
                      </View>
                      <View style={styles.addressInfo}>
                        <View style={styles.addressLabelRow}>
                          <Text style={styles.addressLabel}>
                            {address.label}
                          </Text>
                          {isSelected && (
                            <View style={styles.defaultBadge}>
                              <Text style={styles.defaultBadgeText}>
                                Default
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.addressActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditAddress(address.id)}
                      >
                        <IconEdit size={22} color='#007AFF' />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(address.id, address.label)}
                      >
                        <IconTrash size={22} color='#FF5722' />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.addressContent}>
                    <IconMapPin size={16} color='#666' />
                    <Text style={styles.addressText}>{address.address}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
          <IconCirclePlus size={24} color='#fff' />
          <Text style={styles.addButtonText}>Add New Address</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addressList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedAddressCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#F1F8F4',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
