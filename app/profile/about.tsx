import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header showBack={true} title='About' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='information-circle' size={48} color='#4CAF50' />
          </View>
          <Text style={styles.title}>About</Text>
          <Text style={styles.subtitle}>
            Learn more about Vitura and our policies
          </Text>
        </View>

        {/* Terms of Service Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => router.push('/profile/terms-of-service')}
          >
            <View style={styles.linkContent}>
              <View style={styles.linkIconContainer}>
                <Ionicons name='document-text' size={24} color='#4CAF50' />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkTitle}>Terms of Service</Text>
                <Text style={styles.linkSubtitle}>
                  Read our terms and conditions
                </Text>
              </View>
              <Ionicons name='chevron-forward' size={20} color='#999' />
            </View>
          </TouchableOpacity>
        </View>

        {/* Privacy Policy Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => router.push('/profile/privacy-policy')}
          >
            <View style={styles.linkContent}>
              <View style={styles.linkIconContainer}>
                <Ionicons name='shield-checkmark' size={24} color='#4CAF50' />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkTitle}>Privacy Policy</Text>
                <Text style={styles.linkSubtitle}>
                  How we protect your privacy
                </Text>
              </View>
              <Ionicons name='chevron-forward' size={20} color='#999' />
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>App Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Build Number</Text>
              <Text style={styles.infoValue}>1</Text>
            </View>
          </View>
        </View>

        {/* About Us Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Vitura</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              Vitura is your trusted partner for fresh, quality produce
              delivered right to your doorstep. We connect local farmers with
              customers, ensuring you get the best products at competitive
              prices.
            </Text>
            <Text style={styles.contentText}>
              Our mission is to make fresh, healthy produce accessible to
              everyone while supporting local agriculture and sustainable
              farming practices.
            </Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>
              Email: support@vitura.com{'\n'}
              Phone: +91 98765 43210
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
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  linkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  linkSubtitle: {
    fontSize: 14,
    color: '#666',
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
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
});

