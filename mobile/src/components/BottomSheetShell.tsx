import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius, shadow, spacing } from '@/theme';

/**
 * Lightweight bottom sheet built on Animated (no gesture-handler / reanimated).
 * Toggles between a collapsed peek height and an expanded height on tap.
 */
export function BottomSheetShell({
  expanded,
  onToggle,
  collapsedHeight = 220,
  children,
}: {
  expanded: boolean;
  onToggle: (next: boolean) => void;
  collapsedHeight?: number;
  children: React.ReactNode;
}) {
  const screenH = Dimensions.get('window').height;
  const expandedHeight = Math.min(screenH * 0.72, 560);
  const height = useRef(new Animated.Value(collapsedHeight)).current;

  useEffect(() => {
    Animated.spring(height, {
      toValue: expanded ? expandedHeight : collapsedHeight,
      useNativeDriver: false,
      damping: 18,
      stiffness: 140,
      mass: 0.9,
    }).start();
  }, [expanded, expandedHeight, collapsedHeight, height]);

  return (
    <Animated.View style={[styles.sheet, shadow.lg, { height }]}>
      <Pressable
        onPress={() => onToggle(!expanded)}
        style={styles.handleZone}
        hitSlop={10}
      >
        <View style={styles.handle} />
      </Pressable>
      <View style={styles.body}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  handleZone: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  body: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: 86 },
});
