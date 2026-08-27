import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { colors, type } from '@/theme';

type Variant = keyof typeof type;

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
}

export function Text({ variant = 'body', color, center, style, ...rest }: Props) {
  return (
    <RNText
      {...rest}
      style={[
        type[variant],
        { color: color ?? colors.text },
        center && styles.center,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
