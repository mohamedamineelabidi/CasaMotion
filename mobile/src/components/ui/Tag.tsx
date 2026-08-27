import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme';
import { Text } from './Text';

type Tone = 'blue' | 'ok' | 'warn' | 'err' | 'neutral' | 'dark';

const BG: Record<Tone, string> = {
  blue: colors.blueSoft,
  ok: colors.okSoft,
  warn: colors.warnSoft,
  err: colors.errSoft,
  neutral: colors.panel,
  dark: colors.primary,
};
const FG: Record<Tone, string> = {
  blue: colors.blue,
  ok: colors.ok,
  warn: colors.warn,
  err: colors.err,
  neutral: colors.text2,
  dark: colors.white,
};

export function Tag({
  label,
  tone = 'neutral',
  dot,
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <View style={[styles.tag, { backgroundColor: BG[tone] }]}>
      {dot && <View style={[styles.dot, { backgroundColor: FG[tone] }]} />}
      <Text variant="caption" color={FG[tone]} style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { textTransform: 'uppercase' },
});
