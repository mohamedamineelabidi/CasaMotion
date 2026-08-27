import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

interface Props extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ padded = true, elevated = true, style, ...rest }: Props) {
  return (
    <View
      {...rest}
      style={[
        styles.card,
        padded && styles.padded,
        elevated && shadow.sm,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  padded: { padding: spacing.xl },
});
