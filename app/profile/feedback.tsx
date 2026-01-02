import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Header from '../../components/Header';

export default function FeedbackScreen() {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (feedback.trim().length < 10) {
      Alert.alert(
        'Feedback Required',
        'Please provide at least 10 characters of feedback.'
      );
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input!',
        [
          {
            text: 'OK',
            onPress: () => {
              setRating(null);
              setFeedback('');
            },
          },
        ]
      );
    }, 1000);
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Ionicons
              name={star <= (rating || 0) ? 'star' : 'star-outline'}
              size={40}
              color={star <= (rating || 0) ? '#FFD700' : '#ddd'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header showBack={true} title='Feedback' />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='chatbubble-ellipses' size={48} color='#4CAF50' />
          </View>
          <Text style={styles.title}>We'd Love Your Feedback</Text>
          <Text style={styles.subtitle}>
            Help us improve by sharing your experience
          </Text>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          <View style={styles.ratingCard}>
            {renderStars()}
            {rating && (
              <Text style={styles.ratingText}>
                {rating === 5
                  ? 'Excellent!'
                  : rating === 4
                  ? 'Great!'
                  : rating === 3
                  ? 'Good'
                  : rating === 2
                  ? 'Fair'
                  : 'Poor'}
              </Text>
            )}
          </View>
        </View>

        {/* Feedback Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell Us More</Text>
          <View style={styles.feedbackCard}>
            <TextInput
              style={styles.textInput}
              placeholder='Share your thoughts, suggestions, or report any issues...'
              placeholderTextColor='#999'
              multiline
              numberOfLines={8}
              value={feedback}
              onChangeText={setFeedback}
              textAlignVertical='top'
            />
            <Text style={styles.charCount}>
              {feedback.length} / 500 characters
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Additional Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Ways to Reach Us</Text>
          <View style={styles.optionsCard}>
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionIconContainer}>
                <Ionicons name='mail' size={24} color='#4CAF50' />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Email Us</Text>
                <Text style={styles.optionSubtitle}>support@vitura.com</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.optionItem}>
              <View style={styles.optionIconContainer}>
                <Ionicons name='call' size={24} color='#4CAF50' />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Call Us</Text>
                <Text style={styles.optionSubtitle}>+91 98765 43210</Text>
              </View>
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
    textAlign: 'center',
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
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 8,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  textInput: {
    fontSize: 14,
    color: '#333',
    padding: 16,
    minHeight: 150,
    maxHeight: 200,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
});

