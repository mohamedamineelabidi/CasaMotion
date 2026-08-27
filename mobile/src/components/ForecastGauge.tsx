import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '@/theme';
import { Text } from './ui/Text';

/** Visualizes predicted demand (0..~90) as a bar with a level label. */
export function ForecastGauge({ value }: { value: number }) {
  const max = 91;
  const pct = Math.max(0.04, Math.min(1, value / max));
  const level =
    value >= 60 ? { label: 'High demand', tone: colors.err }
      : value >= 35 ? { label: 'Moderate demand', tone: colors.warn }
        : { label: 'Low demand', tone: colors.ok };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text variant="h1" color={colors.text}>
          {value.toFixed(1)}
        </Text>
        <Text variant="small" color={colors.text2}>
          est. requests / 30-min slot
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: level.tone }]} />
      </View>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: level.tone }]} />
        <Text variant="smallStrong" color={level.tone}>
          {level.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  head: { alignItems: 'flex-start', gap: 2 },
  track: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.panel,
    overflow: 'hidden',
  },
  fill: { height: 12, borderRadius: radius.pill },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
