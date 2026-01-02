import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I place an order?',
    answer:
      'Browse through our categories, add items to your cart, select your delivery address, and proceed to checkout. You can pay using various payment methods.',
  },
  {
    id: '2',
    question: 'What are the delivery charges?',
    answer:
      'Delivery charges vary based on your location and order value. Standard delivery fee is ₹50. Free delivery is available on orders above ₹500.',
  },
  {
    id: '3',
    question: 'How long does delivery take?',
    answer:
      'We typically deliver within 2-4 hours for standard delivery. Express delivery options are available for faster service.',
  },
  {
    id: '4',
    question: 'Can I cancel my order?',
    answer:
      'Yes, you can cancel your order within 30 minutes of placing it. After that, please contact our support team for assistance.',
  },
  {
    id: '5',
    question: 'What payment methods do you accept?',
    answer:
      'We accept cash on delivery, credit/debit cards, UPI, and digital wallets like Paytm, PhonePe, and Google Pay.',
  },
  {
    id: '6',
    question: 'How do I track my order?',
    answer:
      'You can track your order in the "My Orders" section of your profile. You will receive real-time updates via SMS and notifications.',
  },
];

export default function HelpSupportScreen() {
  const handleCallSupport = () => {
    Linking.openURL('tel:+919876543210');
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@vitura.com');
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL('https://wa.me/919876543210');
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='help-circle' size={48} color='#4CAF50' />
          </View>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>
            We're here to help you with any questions or concerns
          </Text>
        </View>

        {/* Contact Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.contactCard}>
            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleCallSupport}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name='call' size={24} color='#4CAF50' />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Call Us</Text>
                <Text style={styles.contactValue}>+91 98765 43210</Text>
              </View>
              <Ionicons name='chevron-forward' size={20} color='#999' />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleEmailSupport}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name='mail' size={24} color='#4CAF50' />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Us</Text>
                <Text style={styles.contactValue}>support@vitura.com</Text>
              </View>
              <Ionicons name='chevron-forward' size={20} color='#999' />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.contactItem}
              onPress={handleWhatsAppSupport}
            >
              <View style={styles.contactIconContainer}>
                <Ionicons name='logo-whatsapp' size={24} color='#25D366' />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactValue}>Chat with us</Text>
              </View>
              <Ionicons name='chevron-forward' size={20} color='#999' />
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqCard}>
            {faqs.map((faq, index) => (
              <View key={faq.id}>
                <View style={styles.faqItem}>
                  <View style={styles.faqContent}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                </View>
                {index < faqs.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Support Hours */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Ionicons name='time-outline' size={24} color='#4CAF50' />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Support Hours</Text>
              <Text style={styles.infoText}>
                Monday - Saturday: 9:00 AM - 9:00 PM
              </Text>
              <Text style={styles.infoText}>Sunday: 10:00 AM - 6:00 PM</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <TouchableOpacity style={styles.aboutItem}>
              <Text style={styles.aboutText}>Terms & Conditions</Text>
              <Ionicons name='chevron-forward' size={20} color='#999' />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.aboutItem}>
              <Text style={styles.aboutText}>Privacy Policy</Text>
              <Ionicons name='chevron-forward' size={20} color='#999' />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.aboutItem}>
              <Text style={styles.aboutText}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </TouchableOpacity>
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
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  faqItem: {
    padding: 16,
  },
  faqContent: {
    gap: 8,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  aboutText: {
    fontSize: 16,
    color: '#333',
  },
  aboutValue: {
    fontSize: 14,
    color: '#666',
  },
});

