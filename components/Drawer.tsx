import { IconX } from '@tabler/icons-react-native';
import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  textDark: '#111827',
  textGray: '#6B7280',
  border: '#F3F4F6',
};

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  maxHeight?: DimensionValue;
  headerComponent?: ReactNode;
}

export default function Drawer({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = '70%',
  headerComponent,
}: DrawerProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='none'
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalBackdrop, { opacity: backdropOpacity }]}
        >
          <Pressable style={styles.fill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY }], maxHeight },
          ]}
        >
          {/* Modal Header */}
          {(title || subtitle || headerComponent) && (
            <View style={styles.modalHeader}>
              {headerComponent || (
                <View>
                  {title && <Text style={styles.modalTitle}>{title}</Text>}
                  {subtitle && (
                    <Text style={styles.modalSubtitle}>{subtitle}</Text>
                  )}
                </View>
              )}
              <TouchableOpacity
                onPress={handleClose}
                style={styles.modalCloseBtn}
              >
                <IconX size={20} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          <View style={styles.contentWrapper}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  fill: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contentWrapper: {
    // flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.textGray,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: COLORS.border,
    borderRadius: 20,
  },
});
