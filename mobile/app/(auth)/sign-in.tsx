import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Card, Text } from '@/components/ui';
import { CasaLogo } from '@/components/CasaLogo';
import { useAuth } from '@/contexts/AuthContext';
import { notify } from '@/lib/dialog';
import { Role } from '@/lib/types';
import { colors, radius, spacing } from '@/theme';

export default function SignIn() {
  const { signIn, backendOnline, ready, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('rider1');
  const [role, setRole] = useState<Role>('rider');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim()) {
      notify('Enter a name', 'Please choose a display name to continue.');
      return;
    }
    setLoading(true);
    try {
      await signIn(username.trim(), role);
      router.replace('/(tabs)');
    } catch (e) {
      notify('Sign-in failed', 'Could not reach the server. Try again or continue in demo mode.');
    } finally {
      setLoading(false);
    }
  };

  if (ready && isAuthenticated) return <Redirect href="/(tabs)" />;

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.top}>
        <View style={styles.logoBadge}>
          <CasaLogo size={40} />
        </View>
        <Text variant="h1" style={styles.title}>
          Welcome back
        </Text>
        <Text variant="body" color={colors.text2}>
          Sign in to book rides and see live taxis across Casablanca.
        </Text>
      </View>

      <Card style={styles.form}>
        <View style={styles.field}>
          <Text variant="smallStrong" color={colors.text2}>
            Display name
          </Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={colors.text3} />
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="e.g. rider1"
              placeholderTextColor={colors.text3}
              autoCapitalize="none"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text variant="smallStrong" color={colors.text2}>
            Account type
          </Text>
          <View style={styles.roles}>
            {(['rider', 'admin'] as Role[]).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={[styles.role, role === r && styles.roleOn]}
              >
                <Ionicons
                  name={r === 'rider' ? 'car-outline' : 'shield-outline'}
                  size={18}
                  color={role === r ? colors.text : colors.text3}
                />
                <Text
                  variant="bodyStrong"
                  color={role === r ? colors.text : colors.text2}
                >
                  {r === 'rider' ? 'Rider' : 'Admin'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Button title="Continue" onPress={submit} loading={loading} />
      </Card>

      <View style={styles.status}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: backendOnline ? colors.ok : colors.warn },
          ]}
        />
        <Text variant="small" color={colors.text3}>
          {backendOnline
            ? 'Backend online — live data'
            : 'Backend offline — you can still explore in demo mode'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: spacing.xl, gap: 8, marginBottom: spacing.xl },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { marginTop: spacing.sm },
  form: { gap: spacing.lg },
  field: { gap: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: colors.bg,
  },
  input: { flex: 1, color: colors.text, fontSize: 15, fontFamily: 'Manrope_500Medium' },
  roles: { flexDirection: 'row', gap: 10 },
  role: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  roleOn: { borderColor: colors.primary, backgroundColor: colors.inkSoft },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xl,
    justifyContent: 'center',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
