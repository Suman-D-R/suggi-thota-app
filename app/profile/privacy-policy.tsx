import { Ionicons } from '@expo/vector-icons';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Header from '../../components/Header';

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <Header showBack={true} title='Privacy Policy' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='shield-checkmark' size={48} color='#4CAF50' />
          </View>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>
            Your privacy is important to us
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              At Vitura, we are committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, and safeguard your
              personal information.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              We collect information that you provide directly to us, including
              your name, email address, phone number, delivery address, and
              payment information when you create an account or place an order.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              We use the information we collect to process your orders, improve
              our services, communicate with you about your orders, send you
              promotional materials (with your consent), and ensure the security
              of our platform.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Information Sharing</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              We do not sell your personal information. We may share your
              information with service providers who assist us in operating our
              platform, processing payments, and delivering orders. These
              partners are required to protect your information.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              We implement appropriate security measures to protect your personal
              information against unauthorized access, alteration, disclosure, or
              destruction. However, no method of transmission over the internet
              is 100% secure.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Your Rights</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              You have the right to access, update, or delete your personal
              information at any time. You can also opt-out of receiving
              promotional communications from us by updating your preferences in
              your account settings.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cookies and Tracking</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              We use cookies and similar tracking technologies to enhance your
              experience, analyze usage patterns, and personalize content. You can
              control cookie preferences through your device settings.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Changes to This Policy</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              We may update this Privacy Policy from time to time. We will notify
              you of any changes by posting the new policy on this page and
              updating the "Last Updated" date.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              If you have any questions about this Privacy Policy, please
              contact us at support@vitura.com
            </Text>
          </View>
        </View>
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
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

