import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Text, Button, ListRow } from '@/components/ui';
import { CasaLogo } from '@/components/CasaLogo';
import { useAuth } from '@/contexts/AuthContext';
import { config } from '@/lib/config';
import { confirmAction, notify } from '@/lib/dialog';
import { colors, radius, spacing } from '@/theme';

export default function You() {
  const { username, role, backendOnline, signOut, refreshHealth } = useAuth();

  const doSignOut = () => {
    confirmAction({
      title: 'Sign out?',
      message: 'You will need to sign in again to book rides.',
      confirmLabel: 'Sign out',
      destructive: true,
      onConfirm: async () => {
        await signOut();
        router.replace('/(auth)/sign-in');
      },
    });
  };

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text variant="h2" color={colors.white}>
            {(username ?? 'U').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text variant="h2">{username ?? 'Rider'}</Text>
        <Text variant="body" color={colors.text2}>
          {role === 'admin' ? 'Administrator' : 'Rider'} account
        </Text>
      </View>

      <Card padded={false} style={styles.card}>
        <View style={styles.cardInner}>
          <ListRow
            icon={backendOnline ? 'cloud-done' : 'cloud-offline'}
            iconColor={backendOnline ? colors.ok : colors.warn}
            iconBg={backendOnline ? colors.okSoft : colors.warnSoft}
            title={backendOnline ? 'Backend online' : 'Demo mode'}
            subtitle={backendOnline ? 'Live data from CasaMotion API' : 'Using simulated data'}
            right={
              <Text variant="smallStrong" color={colors.text} onPress={refreshHealth}>
                Refresh
              </Text>
            }
          />
          <View style={styles.sep} />
          <ListRow
            icon="server-outline"
            title="API endpoint"
            subtitle={config.apiBaseUrl}
          />
        </View>
      </Card>

      <Text variant="smallStrong" color={colors.text2} style={styles.section}>
        PREFERENCES
      </Text>
      <Card padded={false} style={styles.card}>
        <View style={styles.cardInner}>
          <ListRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Ride updates & alerts"
            onPress={() => notify('Coming soon', 'Notifications are not part of this build.')}
          />
          <View style={styles.sep} />
          <ListRow
            icon="shield-checkmark-outline"
            title="Privacy"
            subtitle="Trips stored locally on device"
            onPress={() => notify('Privacy', 'Trip history never leaves this device in this build.')}
          />
          <View style={styles.sep} />
          <ListRow
            icon="help-circle-outline"
            title="About CasaMotion"
            subtitle="Casablanca smart mobility"
            onPress={() => router.push('/onboarding')}
          />
        </View>
      </Card>

      <Button
        title="Sign out"
        variant="ghost"
        titleColor={colors.err}
        onPress={doSignOut}
        left={<Ionicons name="log-out-outline" size={18} color={colors.err} />}
        style={styles.signout}
      />

      <View style={styles.footer}>
        <CasaLogo size={26} />
        <Text variant="small" color={colors.text3}>
          CasaMotion · v1.0.0
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', gap: 4, paddingTop: spacing.xl, marginBottom: spacing.xl },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  card: { marginBottom: spacing.lg, overflow: 'hidden' },
  cardInner: { paddingHorizontal: spacing.lg },
  sep: { height: 1, backgroundColor: colors.line2 },
  section: { marginBottom: spacing.sm },
  signout: { marginTop: spacing.sm },
  footer: { alignItems: 'center', gap: 6, paddingVertical: spacing.xl },
});
