import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { DEFAULT_FONT } from '../constants/fonts';

interface TextProps extends RNTextProps {
  /**
   * Font weight variant
   * - 'thin' (100)
   * - 'light' (300)
   * - 'regular' (400) - default
   * - 'medium' (500)
   * - 'bold' (700)
   * - 'black' (900)
   */
  weight?: 'thin' | 'light' | 'regular' | 'medium' | 'bold' | 'black';
  /**
   * Whether to use italic variant
   */
  italic?: boolean;
}

/**
 * Custom Text component that uses Roboto font by default
 * 
 * @example
 * <Text>Regular text</Text>
 * <Text weight="bold">Bold text</Text>
 * <Text weight="medium" italic>Medium italic text</Text>
 */
export default function Text({ 
  style, 
  weight = 'regular', 
  italic = false,
  ...props 
}: TextProps) {
  const fontFamily = getFontFamily(weight, italic);
  
  return (
    <RNText 
      style={[styles.default, { fontFamily }, style]} 
      {...props} 
    />
  );
}

function getFontFamily(weight: string, italic: boolean): string {
  const suffix = italic ? '_Italic' : '';
  
  switch (weight) {
    case 'thin':
      return `Roboto_100Thin${suffix}`;
    case 'light':
      return `Roboto_300Light${suffix}`;
    case 'regular':
      return `Roboto_400Regular${suffix}`;
    case 'medium':
      return `Roboto_500Medium${suffix}`;
    case 'bold':
      return `Roboto_700Bold${suffix}`;
    case 'black':
      return `Roboto_900Black${suffix}`;
    default:
      return DEFAULT_FONT;
  }
}

const styles = StyleSheet.create({
  default: {
    fontFamily: DEFAULT_FONT,
  },
});

