import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme';
import { Text } from './Text';

export function ZoneChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipOn : styles.chipOff,
        { transform: [{ scale: pressed ? 0.96 : 1 }] },
      ]}
    >
      <Text variant="smallStrong" color={selected ? colors.white : colors.text2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
  },
  chipOff: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
