import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Modern theme constants
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

interface LoginPromptProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    buttonText: string;
    modalTitle?: string;
    modalMessage?: string;
    showArrowIcon?: boolean;
    pathname?: string;
}

export default function LoginPrompt({
    icon,
    title,
    subtitle,
    buttonText,
    showArrowIcon = false,
    pathname = '/',
}: LoginPromptProps) {

    return (
        <View style={styles.container}>
            <View style={styles.centerContent}>
                <View style={styles.iconCircle}>
                    <Ionicons name={icon} size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.titleText}>{title}</Text>
                <Text style={styles.subText}>{subtitle}</Text>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push(`/login?redirect=${pathname}`)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.primaryButtonText}>{buttonText}</Text>
                    {showArrowIcon && (
                        <Ionicons name='arrow-forward' size={18} color='#FFF' />
                    )}
                </TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        marginTop: 60,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleText: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textDark,
        marginBottom: 8,
        textAlign: 'center',
    },
    subText: {
        fontSize: 14,
        color: COLORS.textGray,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        gap: 8,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

