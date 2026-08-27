import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '@/theme';

/** Circular icon button used for back / close actions on sub-pages. */
export function IconButton({
  icon,
  onPress,
  size = 42,
  color = colors.text,
  elevated = true,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  color?: string;
  elevated?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        elevated && shadow.sm,
        { transform: [{ scale: pressed ? 0.94 : 1 }] },
        style,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
