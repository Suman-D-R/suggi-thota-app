import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../components/Header';

// --- MODERN CONSTANTS (Matching app theme) ---
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

// --- Interfaces ---
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: string;
  type?: 'message' | 'quick_action';
}

export default function SupportChatScreen() {
  const router = useRouter();
  const { orderNumber } = useLocalSearchParams<{ orderNumber?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Hello! How can I help you with your order today?',
      sender: 'support',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const quickActions = [
    { id: 'return', label: 'Return Order', icon: 'arrow-undo' },
    { id: 'cancel', label: 'Cancel Order', icon: 'close-circle' },
    { id: 'time', label: 'Delivery Time', icon: 'time' },
    { id: 'status', label: 'Order Status', icon: 'information-circle' },
  ];

  const handleQuickAction = (actionId: string) => {
    let responseText = '';
    switch (actionId) {
      case 'return':
        responseText =
          'I can help you with returning your order. Please select the items you want to return from your order.';
        break;
      case 'cancel':
        responseText =
          'I can help you cancel your order. Please note that cancellation is only possible if your order hasn\'t been prepared yet.';
        break;
      case 'time':
        responseText =
          'Your order is estimated to be delivered within 30-45 minutes. You can track the real-time status in the order details.';
        break;
      case 'status':
        responseText = orderNumber
          ? `Your order #${orderNumber} is currently being prepared. You'll receive updates as it progresses.`
          : 'I can help you check your order status. Please provide your order number.';
        break;
      default:
        responseText = 'How can I assist you with that?';
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: quickActions.find((a) => a.id === actionId)?.label || '',
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      type: 'quick_action',
    };

    const supportMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: 'support',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMessage, supportMessage]);
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const supportMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: 'Thank you for your message. Our support team will get back to you shortly. In the meantime, you can use the quick actions below for common requests.',
      sender: 'support',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMessage, supportMessage]);
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <Header
        showBack={true}
        title='Customer Support'
        backgroundColor={COLORS.bg}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Chat Messages */}
        <ScrollView
          style={styles.chatMessagesContainer}
          contentContainerStyle={styles.chatMessagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.chatMessageWrapper,
                message.sender === 'user'
                  ? styles.chatMessageUser
                  : styles.chatMessageSupport,
              ]}
            >
              {message.sender === 'support' && (
                <View style={styles.chatSupportAvatar}>
                  <Ionicons
                    name='headset'
                    size={14}
                    color={COLORS.primary}
                  />
                </View>
              )}
              <View
                style={[
                  styles.chatMessageBubble,
                  message.sender === 'user'
                    ? styles.chatMessageBubbleUser
                    : styles.chatMessageBubbleSupport,
                ]}
              >
                <Text
                  style={[
                    styles.chatMessageText,
                    message.sender === 'user'
                      ? styles.chatMessageTextUser
                      : styles.chatMessageTextSupport,
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.chatMessageTime,
                    message.sender === 'user'
                      ? styles.chatMessageTimeUser
                      : styles.chatMessageTimeSupport,
                  ]}
                >
                  {message.timestamp}
                </Text>
              </View>
            </View>
          ))}

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickActionButton}
                  onPress={() => handleQuickAction(action.id)}
                >
                  <View style={styles.quickActionIcon}>
                    <Ionicons
                      name={action.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <SafeAreaView edges={['bottom']}>
            <View style={{ height: 20 }} />
          </SafeAreaView>
        </ScrollView>

        {/* Chat Input */}
        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder='Type your message...'
              placeholderTextColor={COLORS.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.chatSendButton,
                !inputText.trim() && styles.chatSendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name='send'
                size={20}
                color={inputText.trim() ? COLORS.bg : COLORS.textLight}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  chatMessagesContainer: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  chatMessageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  chatMessageUser: {
    justifyContent: 'flex-end',
  },
  chatMessageSupport: {
    justifyContent: 'flex-start',
  },
  chatSupportAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  chatMessageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chatMessageBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  chatMessageBubbleSupport: {
    backgroundColor: COLORS.primarySoft,
    borderBottomLeftRadius: 4,
  },
  chatMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatMessageTextUser: {
    color: COLORS.bg,
    fontWeight: '500',
  },
  chatMessageTextSupport: {
    color: COLORS.textDark,
    fontWeight: '500',
  },
  chatMessageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  chatMessageTimeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  chatMessageTimeSupport: {
    color: COLORS.textGray,
  },
  quickActionsContainer: {
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  inputSafeArea: {
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 100,
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
});

