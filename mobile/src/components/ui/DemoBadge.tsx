import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme';
import { Text } from './Text';

/** Small banner shown when the app is running on mock data (backend offline). */
export function DemoBadge({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <View style={styles.pill}>
        <View style={styles.dot} />
        <Text variant="caption" color={colors.warn}>
          DEMO
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.warn} />
      <Text variant="smallStrong" color={colors.warn} style={styles.flex}>
        Demo mode — showing simulated data. Start the backend to go live.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warnSoft,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  flex: { flex: 1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.warnSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warn },
});
