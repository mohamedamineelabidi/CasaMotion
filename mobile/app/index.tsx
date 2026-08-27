import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { isOnboarded } from '@/lib/store';
import { CasaLogo } from '@/components/CasaLogo';
import { Text } from '@/components/ui';
import { colors } from '@/theme';

export default function Index() {
  const { ready, isAuthenticated } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboarded().then(setOnboarded);
  }, []);

  if (!ready || onboarded === null) {
    return (
      <View style={styles.splash}>
        <CasaLogo size={72} />
        <Text variant="h2" style={styles.brand}>
          CasaMotion
        </Text>
        <ActivityIndicator color={colors.primary} style={styles.spin} />
      </View>
    );
  }

  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    gap: 10,
  },
  brand: { marginTop: 4 },
  spin: { marginTop: 20 },
});
