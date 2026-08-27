import React, { useRef, useState } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Text } from '@/components/ui';
import { CasaLogo } from '@/components/CasaLogo';
import { useAuth } from '@/contexts/AuthContext';
import { setOnboarded } from '@/lib/store';
import { colors, radius, spacing } from '@/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'car-sport' as const,
    title: 'Casablanca, on the move',
    body: 'See nearby taxis across all 16 zones in real time and book a ride in seconds.',
  },
  {
    icon: 'analytics' as const,
    title: 'Smarter than a hail',
    body: 'Live demand forecasts help you choose the fastest zone and the right time to travel.',
  },
  {
    icon: 'shield-checkmark' as const,
    title: 'Private by design',
    body: 'Trips are anonymized. Your history stays on your device unless you choose to sync.',
  },
];

export default function Onboarding() {
  const { isAuthenticated } = useAuth();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const last = index === SLIDES.length - 1;

  const finish = async () => {
    await setOnboarded();
    router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/sign-in');
  };

  const next = async () => {
    if (last) {
      await finish();
      return;
    }
    const n = index + 1;
    listRef.current?.scrollToIndex({ index: n, animated: true });
    setIndex(n);
  };

  const skip = finish;

  return (
    <Screen padded={false} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <CasaLogo size={30} />
          <Text variant="title">CasaMotion</Text>
        </View>
        {!last && (
          <Text variant="smallStrong" color={colors.text3} onPress={skip}>
            Skip
          </Text>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={60} color={colors.white} />
            </View>
            <Text variant="h1" center>
              {item.title}
            </Text>
            <Text variant="body" color={colors.text2} center style={styles.body}>
              {item.body}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotOn]}
            />
          ))}
        </View>
        <Button title={last ? 'Get started' : 'Continue'} onPress={next} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 14,
  },
  iconWrap: {
    width: 128,
    height: 128,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  body: { maxWidth: 300 },
  footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotOn: { width: 22, backgroundColor: colors.primary },
});
