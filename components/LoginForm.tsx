import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useUserStore } from '../store/userStore';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLORS = {
  primary: '#059669', // Emerald 600
  primaryDark: '#047857',
  primaryLight: '#D1FAE5', // Emerald 100
  textMain: '#1F2937', // Gray 900
  textSub: '#6B7280', // Gray 500
  inputBg: '#F3F4F6', // Gray 100
  surface: '#FFFFFF',
  error: '#EF4444',
  border: '#E5E7EB',
};

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
  const [inputFocus, setInputFocus] = useState<string | null>(null);

  const phoneInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);

  const sendOTP = useUserStore((state) => state.sendOTP);
  const verifyOTP = useUserStore((state) => state.verifyOTP);
  const loginWithGoogle = useUserStore((state) => state.loginWithGoogle);
  const googleUser = useUserStore((state) => state.googleUser);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'YOUR_ID_HERE',
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'YOUR_ID_HERE',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_ID_HERE',
  });

  // Animations & Logic (Kept same as original)
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (step === 'otp') setTimeout(() => otpInputRef.current?.focus(), 300);
    else if (step === 'name')
      setTimeout(() => nameInputRef.current?.focus(), 300);
  }, [step]);

  const handleGoogleAuthSuccess = useCallback(
    async (accessToken: string) => {
      try {
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (!userInfoResponse.ok) throw new Error('Failed to fetch user info');
        const userInfo = await userInfoResponse.json();
        loginWithGoogle(userInfo.email, userInfo.name || userInfo.email);
        setStep('phone');
        setIsGoogleLoading(false);
      } catch (error) {
        console.error(error);
        setIsGoogleLoading(false);
        Alert.alert('Authentication Error', 'Failed to get user information.');
      }
    },
    [loginWithGoogle]
  );

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.accessToken) {
      handleGoogleAuthSuccess(response.authentication.accessToken);
    } else if (response?.type === 'error') {
      setIsGoogleLoading(false);
    }
  }, [response, handleGoogleAuthSuccess]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0)
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  useEffect(() => {
    if (phoneNumber.length === 10 && (step === 'initial' || step === 'phone')) {
      phoneInputRef.current?.blur();
      Keyboard.dismiss();
    }
  }, [phoneNumber, step]);

  const formatPhoneNumber = (text: string) =>
    text.replace(/\D/g, '').slice(0, 10);

  const handleSendOTP = async () => {
    Keyboard.dismiss();
    phoneInputRef.current?.blur();
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length !== 10)
      return Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit number'
      );
    setIsLoading(true);
    try {
      await sendOTP(`+91${cleanedPhone}`);
      setStep('otp');
      setResendTimer(60);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    Keyboard.dismiss();
    if (otp.length !== 6)
      return Alert.alert('Invalid OTP', 'Please enter the 6-digit code');
    setIsLoading(true);
    try {
      const formattedPhone = `+91${phoneNumber.replace(/\D/g, '')}`;
      await verifyOTP(formattedPhone, otp, googleUser?.name || '', googleUser);
      onLoginSuccess?.();
    } catch (error: any) {
      if (error.message === 'NAME_REQUIRED') {
        setStep('name');
        setIsLoading(false);
        return;
      }
      Alert.alert('Verification Failed', error.message || 'Invalid OTP.');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitName = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const formattedPhone = `+91${phoneNumber.replace(/\D/g, '')}`;
      await verifyOTP(formattedPhone, otp, name.trim(), googleUser);
      onLoginSuccess?.();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      await sendOTP(`+91${phoneNumber.replace(/\D/g, '')}`);
      setResendTimer(60);
      setOtp('');
      Alert.alert('Sent!', 'A new OTP has been sent.');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep(googleUser ? 'phone' : 'initial');
    setOtp('');
    setResendTimer(0);
  };

  return (
    <View style={styles.mainContainer}>
      {/* Skip Button - Top Right */}
      {onSkip && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name='leaf' size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Vitura</Text>
            <Text style={styles.subtitle}>Fresh groceries, delivered.</Text>

            {googleUser && step === 'phone' && (
              <View style={styles.welcomeBadge}>
                <Text style={styles.welcomeText}>
                  👋 Welcome back, {googleUser.name}
                </Text>
              </View>
            )}
          </View>

          {/* Dynamic Form Area */}
          <View style={styles.formContainer}>
            {/* --- PHONE INPUT --- */}
            {(step === 'initial' || step === 'phone') && (
              <View style={styles.stepContainer}>
                <Text style={styles.label}>Mobile Number</Text>

                <View
                  style={[
                    styles.inputContainer,
                    inputFocus === 'phone' && styles.inputFocused,
                    phoneNumber.length === 10 && styles.inputSuccess,
                  ]}
                >
                  <Text style={styles.prefix}>+91</Text>
                  <View style={styles.verticalLine} />
                  <TextInput
                    ref={phoneInputRef}
                    style={styles.textInput}
                    placeholder='Phone Number'
                    placeholderTextColor={COLORS.textSub}
                    value={phoneNumber}
                    onFocus={() => setInputFocus('phone')}
                    onBlur={() => setInputFocus(null)}
                    onChangeText={(t) => setPhoneNumber(formatPhoneNumber(t))}
                    keyboardType='phone-pad'
                    maxLength={10}
                    selectionColor={COLORS.primary}
                  />
                  {phoneNumber.length === 10 && (
                    <Ionicons
                      name='checkmark-circle'
                      size={20}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.mainButton,
                    (isLoading || phoneNumber.length !== 10) &&
                    styles.disabledButton,
                  ]}
                  onPress={handleSendOTP}
                  disabled={isLoading || phoneNumber.length !== 10}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <Text style={styles.mainButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>

                {step === 'initial' && (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or login with</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.socialButton,
                        isGoogleLoading && styles.socialButtonDisabled,
                      ]}
                      onPress={() =>
                        !isGoogleLoading && request && promptAsync()
                      }
                      activeOpacity={0.8}
                    >
                      {isGoogleLoading ? (
                        <ActivityIndicator
                          color={COLORS.textMain}
                          size='small'
                        />
                      ) : (
                        <>
                          <Ionicons
                            name='logo-google'
                            size={16}
                            color={COLORS.textMain}
                          />
                          <Text style={styles.socialButtonText}>
                            Continue with Google
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}

            {/* --- OTP INPUT --- */}
            {step === 'otp' && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Verify OTP</Text>
                  <Text style={styles.stepDesc}>
                    Sent to{' '}
                    <Text style={styles.highlight}>+91 {phoneNumber}</Text>
                  </Text>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    inputFocus === 'otp' && styles.inputFocused,
                  ]}
                >
                  <TextInput
                    ref={otpInputRef}
                    style={styles.otpInput}
                    placeholder='000 000'
                    placeholderTextColor={COLORS.textSub} // Lighter placeholder for cleaner look
                    value={otp}
                    onFocus={() => setInputFocus('otp')}
                    onBlur={() => setInputFocus(null)}
                    onChangeText={(t) =>
                      setOtp(t.replace(/\D/g, '').slice(0, 6))
                    }
                    keyboardType='number-pad'
                    maxLength={6}
                    selectionColor={COLORS.primary}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.mainButton,
                    (isLoading || otp.length !== 6) && styles.disabledButton,
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <Text style={styles.mainButtonText}>Verify & Login</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  {resendTimer > 0 ? (
                    <Text style={styles.timer}>Resend in {resendTimer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP}>
                      <Text style={styles.link}>Resend Code</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.dot}>•</Text>
                  <TouchableOpacity onPress={handleBackToPhone}>
                    <Text style={styles.subLink}>Change Number</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* --- NAME INPUT --- */}
            {step === 'name' && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Profile Details</Text>
                  <Text style={styles.stepDesc}>
                    How should we address you?
                  </Text>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    inputFocus === 'name' && styles.inputFocused,
                  ]}
                >
                  <Ionicons
                    name='person'
                    size={20}
                    color={COLORS.textSub}
                    style={{ marginLeft: 16 }}
                  />
                  <TextInput
                    ref={nameInputRef}
                    style={[styles.textInput, { paddingLeft: 12 }]}
                    placeholder='Full Name'
                    placeholderTextColor={COLORS.textSub}
                    value={name}
                    onFocus={() => setInputFocus('name')}
                    onBlur={() => setInputFocus(null)}
                    onChangeText={setName}
                    autoCapitalize='words'
                    selectionColor={COLORS.primary}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.mainButton,
                    (isLoading || !name.trim()) && styles.disabledButton,
                  ]}
                  onPress={handleSubmitName}
                  disabled={isLoading || !name.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator color='#fff' />
                  ) : (
                    <Text style={styles.mainButtonText}>Get Started</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 40,
  },

  // Skip Button
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Header Styling
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textMain,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  welcomeBadge: {
    marginTop: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },

  // Form Components
  formContainer: {
    width: '100%',
  },
  stepContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Clean Input Styling (No border default, visible background)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    height: 50,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent', // Invisible border until focused
  },
  inputFocused: {
    borderColor: COLORS.primary, // Clean colored ring
    backgroundColor: '#FFFFFF', // White background on focus for pop
  },
  inputSuccess: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMain,
    paddingLeft: 20,
  },
  verticalLine: {
    width: 1,
    height: 24,
    backgroundColor: '#D1D5DB', // Gray 300
    marginHorizontal: 16,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.textMain,
    paddingRight: 20,
  },
  inputIcon: {
    marginRight: 16,
  },

  // OTP Specifics
  otpInput: {
    flex: 1,
    height: '100%',
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textMain,
    textAlign: 'center',
    letterSpacing: 12,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 15,
    color: COLORS.textSub,
  },
  highlight: {
    color: COLORS.textMain,
    fontWeight: '600',
  },

  // Buttons
  mainButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB', // Gray 200
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSub,
    fontSize: 13,
    fontWeight: '500',
  },

  // Social Button
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  socialButtonDisabled: {
    opacity: 0.7,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },

  // Footer Links
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  timer: {
    color: COLORS.textSub,
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  subLink: {
    color: COLORS.textMain,
    fontWeight: '600',
    fontSize: 14,
  },
  dot: {
    color: COLORS.textSub,
  },
});
