import { Ionicons } from '@expo/vector-icons';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Header from '../../components/Header';

export default function TermsOfServiceScreen() {
  return (
    <View style={styles.container}>
      <Header showBack={true} title='Terms of Service' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='document-text' size={48} color='#4CAF50' />
          </View>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.subtitle}>
            Please read our terms and conditions carefully
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              Welcome to Vitura. By accessing and using our mobile
              application, you agree to be bound by the following terms and
              conditions.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              By using our service, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service and
              all applicable laws and regulations.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Use of Service</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              You agree to use our service only for lawful purposes and in
              accordance with these Terms. You agree not to use the service in
              any way that could damage, disable, or impair the service.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              You are responsible for maintaining the confidentiality of your
              account credentials and for all activities that occur under your
              account.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Orders and Payments</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              All orders are subject to acceptance and availability. Prices are
              subject to change without notice. Payment must be made at the time
              of order or upon delivery as per the selected payment method.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              Vitura shall not be liable for any indirect, incidental,
              special, or consequential damages arising out of or in connection
              with the use of our service.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Changes to Terms</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              We reserve the right to modify these terms at any time. Your
              continued use of the service after any changes constitutes your
              acceptance of the new terms.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              If you have any questions about these Terms of Service, please
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

