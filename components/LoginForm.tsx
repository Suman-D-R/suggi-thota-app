import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useUserStore } from '../store/userStore';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

interface LoginFormProps {
  onLoginSuccess?: () => void;
  showHeader?: boolean;
  onSkip?: () => void;
}

export default function LoginForm({
  onLoginSuccess,
  showHeader = true,
  onSkip,
}: LoginFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'initial' | 'phone' | 'otp' | 'name'>(
    'initial'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const sendOTP = useUserStore((state) => state.sendOTP);
  const verifyOTP = useUserStore((state) => state.verifyOTP);
  const updateUserName = useUserStore((state) => state.updateUserName);
  const loginWithGoogle = useUserStore((state) => state.loginWithGoogle);
  const googleUser = useUserStore((state) => state.googleUser);

  // Google OAuth configuration
  // Replace these with your actual Google OAuth Client IDs from Google Cloud Console
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      '728899715578-kklrs0qnok2jaufok38ekd8873melcnr.apps.googleusercontent.com',
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '<ANDROID CLIENT ID>',
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
      '728899715578-bu7hk6vdnm8q7hfme0dd80rqo9aknj4k.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (step === 'otp') {
      otpInputRef.current?.focus();
    } else if (step === 'name') {
      nameInputRef.current?.focus();
    }
  }, [step]);

  // Handle Google authentication success
  const handleGoogleAuthSuccess = useCallback(
    async (accessToken: string) => {
      try {
        // Fetch user info from Google using the access token
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info');
        }

        const userInfo = await userInfoResponse.json();

        // Store Google user info
        loginWithGoogle(userInfo.email, userInfo.name || userInfo.email);
        setStep('phone');
        setIsGoogleLoading(false);
        Alert.alert(
          'Success',
          'Google login successful. Please verify your phone number.'
        );
      } catch (error) {
        console.error('Error fetching user info:', error);
        setIsGoogleLoading(false);
        Alert.alert(
          'Error',
          'Failed to get user information. Please try again.'
        );
      }
    },
    [loginWithGoogle]
  );

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleAuthSuccess(authentication.accessToken);
      }
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
      Alert.alert('Error', 'Google login failed. Please try again.');
    }
  }, [response, handleGoogleAuthSuccess]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');

    // Limit to 10 digits
    if (cleaned.length <= 10) {
      return cleaned;
    }
    return cleaned.slice(0, 10);
  };

  const handleSendOTP = async () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');

    if (cleanedPhone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `+91${cleanedPhone}`;
      await sendOTP(formattedPhone);
      setStep('otp');
      setResendTimer(60);
      Alert.alert('Success', 'OTP sent to your phone number');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      let errorMessage = 'Failed to send OTP. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `+91${phoneNumber.replace(/\D/g, '')}`;
      // Use name from googleUser if available, otherwise use empty string (will be required if new user)
      const userName = googleUser?.name || '';
      await verifyOTP(formattedPhone, otp, userName, googleUser);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);

      // Check if name is required
      if (error.message === 'NAME_REQUIRED') {
        // Move to name collection step
        setStep('name');
        setIsLoading(false);
        return;
      }

      let errorMessage = 'Invalid OTP. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitName = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const formattedPhone = `+91${phoneNumber.replace(/\D/g, '')}`;
      // Verify OTP again with the name
      await verifyOTP(formattedPhone, otp, name.trim(), googleUser);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('Submit name error:', error);
      let errorMessage = 'Failed to complete registration. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    setIsLoading(true);
    try {
      const formattedPhone = `+91${cleanedPhone}`;
      await sendOTP(formattedPhone);
      setResendTimer(60);
      setOtp('');
      Alert.alert('Success', 'OTP resent to your phone number');
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      let errorMessage = 'Failed to resend OTP. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep(googleUser ? 'phone' : 'initial');
    setOtp('');
    setResendTimer(0);
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      Alert.alert(
        'Error',
        'Google authentication is not ready. Please try again.'
      );
      return;
    }

    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google login error:', error);
      setIsGoogleLoading(false);
      Alert.alert('Error', 'Google login failed. Please try again.');
    }
  };

  const handleStartPhoneLogin = () => {
    setStep('phone');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      {onSkip && (
        <View style={styles.skipContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.content}>
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name='storefront' size={80} color='#4CAF50' />
            </View>
            <Text style={styles.appName}>Vitura</Text>
            <Text style={styles.appTagline}>
              Fresh Groceries Delivered to Your Doorstep
            </Text>
            {step === 'otp' && (
              <Text style={styles.subtitle}>
                OTP sent to +91 {phoneNumber.replace(/\D/g, '')}
              </Text>
            )}
            {step === 'name' && (
              <Text style={styles.subtitle}>
                Please enter your name to complete registration
              </Text>
            )}
            {googleUser && step === 'phone' && (
              <Text style={styles.subtitle}>
                Welcome, {googleUser.name}! Please verify your phone number
              </Text>
            )}
          </View>

          <View style={styles.form}>
            {step === 'initial' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder='Enter your phone number'
                      placeholderTextColor='#999'
                      value={phoneNumber}
                      onChangeText={(text) =>
                        setPhoneNumber(formatPhoneNumber(text))
                      }
                      keyboardType='phone-pad'
                      maxLength={10}
                      autoFocus={false}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    (isLoading ||
                      phoneNumber.replace(/\D/g, '').length !== 10) &&
                      styles.loginButtonDisabled,
                  ]}
                  onPress={handleSendOTP}
                  disabled={
                    isLoading || phoneNumber.replace(/\D/g, '').length !== 10
                  }
                  activeOpacity={0.8}
                >
                  <Ionicons name='call' size={20} color='#fff' />
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    (isLoading || isGoogleLoading || !request) &&
                      styles.loginButtonDisabled,
                  ]}
                  onPress={handleGoogleLogin}
                  disabled={isLoading || isGoogleLoading || !request}
                  activeOpacity={0.8}
                >
                  <Ionicons name='logo-google' size={20} color='#333' />
                  <Text style={styles.googleButtonText}>
                    {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : step === 'phone' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={styles.inputWrapper}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder='Enter your phone number'
                      placeholderTextColor='#999'
                      value={phoneNumber}
                      onChangeText={(text) =>
                        setPhoneNumber(formatPhoneNumber(text))
                      }
                      keyboardType='phone-pad'
                      maxLength={10}
                      autoFocus={false}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    isLoading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : step === 'otp' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <View style={styles.otpContainer}>
                    <TextInput
                      ref={otpInputRef}
                      style={styles.otpInput}
                      placeholder='000000'
                      placeholderTextColor='#999'
                      value={otp}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, '').slice(0, 6);
                        setOtp(cleaned);
                      }}
                      keyboardType='number-pad'
                      maxLength={6}
                      textAlign='center'
                    />
                  </View>
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive OTP? </Text>
                    {resendTimer > 0 ? (
                      <Text style={styles.resendTimerText}>
                        Resend in {resendTimer}s
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResendOTP}
                        disabled={isLoading}
                      >
                        <Text style={styles.resendLink}>Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.otpButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      isLoading && styles.loginButtonDisabled,
                    ]}
                    onPress={handleVerifyOTP}
                    disabled={isLoading || otp.length !== 6}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={handleBackToPhone}
                    disabled={isLoading}
                  >
                    <Ionicons name='arrow-back' size={18} color='#4CAF50' />
                    <Text style={styles.backButtonText}>
                      {googleUser ? 'Back' : 'Change Phone Number'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : step === 'name' ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    ref={nameInputRef}
                    style={styles.input}
                    placeholder='Enter your full name'
                    placeholderTextColor='#999'
                    value={name}
                    onChangeText={setName}
                    autoCapitalize='words'
                    autoFocus={true}
                  />
                </View>

                <View style={styles.otpButtonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      (isLoading || !name.trim()) && styles.loginButtonDisabled,
                    ]}
                    onPress={handleSubmitName}
                    disabled={isLoading || !name.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? 'Submitting...' : 'Continue'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setStep('otp')}
                    disabled={isLoading}
                  >
                    <Ionicons name='arrow-back' size={18} color='#4CAF50' />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  skipContainer: {
    paddingTop: 50,
    paddingRight: 24,
    alignItems: 'flex-end',
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,

    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  form: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginLeft: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  countryCode: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  otpInput: {
    width: '100%',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 14,
    letterSpacing: 6,
  },
  otpButtonContainer: {
    gap: 12,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendTimerText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
