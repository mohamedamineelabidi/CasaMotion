import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  message,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.text} />
      </View>
      <Text variant="h3" center>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color={colors.text2} center style={styles.msg}>
          {message}
        </Text>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: spacing['2xl'], gap: 8 },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  msg: { maxWidth: 280 },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
});
