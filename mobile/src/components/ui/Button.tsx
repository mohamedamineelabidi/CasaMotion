import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  left?: React.ReactNode;
  /** Overrides the label + spinner color for the chosen variant. */
  titleColor?: string;
  style?: ViewStyle;
}

const BG: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.inkSoft,
  ghost: 'transparent',
  danger: colors.err,
};
const FG: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.text,
  ghost: colors.text2,
  danger: colors.white,
};
const HEIGHT: Record<Size, number> = { sm: 42, md: 54, lg: 58 };

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth = true,
  left,
  titleColor,
  disabled,
  style,
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  const fg = titleColor ?? FG[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: BG[variant],
          height: HEIGHT[size],
          opacity: isDisabled ? 0.5 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
          borderWidth: variant === 'ghost' ? 1 : 0,
          borderColor: colors.line,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: fullWidth ? spacing.lg : spacing.xl,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {left}
          <Text variant="title" color={fg} style={styles.label}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16 },
});
