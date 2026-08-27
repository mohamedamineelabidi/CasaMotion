import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  bg?: string;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
}

export function Screen({
  children,
  scroll,
  padded = true,
  edges = ['top'],
  bg = colors.bg,
  contentStyle,
  footer,
}: Props) {
  const inner = (
    <View style={[padded && styles.padded, styles.grow, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.grow}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  grow: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
  scrollContent: { paddingBottom: 108, flexGrow: 1 },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
});
