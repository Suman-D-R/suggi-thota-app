import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';
import { useUserStore } from '../../store/userStore';
import { AUTH_METHODS } from '../../constants/authTypes';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateUserProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || profile.mobileNumber || '',
        dateOfBirth: profile.dateOfBirth ? String(profile.dateOfBirth).split('T')[0] : '',
        gender: (profile.gender as 'male' | 'female' | 'other') || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
      };

      // Only include fields that can be edited based on authMethod
      // If authMethod is undefined (legacy profile), allow editing both
      if ((!profile?.authMethod || profile.authMethod !== AUTH_METHODS.GOOGLE) && formData.email !== profile?.email) {
        updateData.email = formData.email.trim() || undefined;
      }

      if ((!profile?.authMethod || profile.authMethod !== AUTH_METHODS.OTP) && formData.phone !== (profile?.phone || profile?.mobileNumber)) {
        updateData.phone = formData.phone.trim() || undefined;
      }

      if (formData.dateOfBirth !== profile?.dateOfBirth) {
        updateData.dateOfBirth = formData.dateOfBirth || undefined;
      }

      if (formData.gender !== profile?.gender) {
        updateData.gender = formData.gender || undefined;
      }

      await updateUserProfile(updateData);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Update profile error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Header showBack={true} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No profile found</Text>
        </View>
      </View>
    );
  }

  // Handle case where authMethod might be undefined (old profiles)
  // If authMethod is undefined, allow editing both (default behavior)
  const canEditEmail = !profile.authMethod || profile.authMethod !== AUTH_METHODS.GOOGLE;
  const canEditPhone = !profile.authMethod || profile.authMethod !== AUTH_METHODS.OTP;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header showBack={true} title="Edit Profile" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter first name"
              placeholderTextColor="#999"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter last name"
              placeholderTextColor="#999"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Email {!canEditEmail && '(Cannot be changed)'}
            </Text>
            <TextInput
              style={[styles.input, !canEditEmail && styles.inputDisabled]}
              placeholder="Enter email"
              placeholderTextColor="#999"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={canEditEmail}
            />
            {!canEditEmail && (
              <Text style={styles.disabledText}>
                Email cannot be changed for Google login accounts
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Phone Number {!canEditPhone && '(Cannot be changed)'}
            </Text>
            <TextInput
              style={[styles.input, !canEditPhone && styles.inputDisabled]}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              editable={canEditPhone}
            />
            {!canEditPhone && (
              <Text style={styles.disabledText}>
                Phone number cannot be changed for phone number login accounts
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date of Birth</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {(['male', 'female', 'other'] as const).map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    formData.gender === gender && styles.genderOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, gender })}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === gender && styles.genderTextSelected,
                    ]}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  disabledText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 6,
  },
  genderOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  genderText: {
    fontSize: 16,
    color: '#666',
  },
  genderTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
});

