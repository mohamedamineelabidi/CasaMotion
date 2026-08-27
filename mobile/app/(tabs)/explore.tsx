import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Text, DemoBadge, EmptyState } from '@/components/ui';
import { useZones } from '@/hooks/useCasaData';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacing } from '@/theme';

export default function Explore() {
  const { data: zones } = useZones();
  const { demoMode } = useAuth();
  const [q, setQ] = useState('');

  const filtered = (zones ?? []).filter((z) =>
    z.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <Screen scroll edges={['top']}>
      <Text variant="h1" style={styles.title}>
        Explore
      </Text>
      <Text variant="body" color={colors.text2} style={styles.sub}>
        Browse all 16 Casablanca zones and jump into live taxi activity.
      </Text>

      {demoMode && (
        <View style={styles.demo}>
          <DemoBadge />
        </View>
      )}

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.text3} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search a zone…"
          placeholderTextColor={colors.text3}
          style={styles.search}
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.text3} />
          </Pressable>
        )}
      </View>

      <View style={styles.grid}>
        {filtered.map((z) => (
          <Pressable
            key={z.zone_id}
            style={({ pressed }) => [
              styles.cellWrap,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
            onPress={() => router.push({ pathname: '/zone/[id]', params: { id: String(z.zone_id) } })}
          >
            <Card style={styles.cell}>
              <View style={styles.cellIcon}>
                <Ionicons name="location" size={18} color={colors.text} />
              </View>
              <Text variant="bodyStrong" numberOfLines={1}>
                {z.name}
              </Text>
              <Text variant="caption" color={colors.text3}>
                ZONE {z.zone_id}
              </Text>
            </Card>
          </Pressable>
        ))}
      </View>

      {filtered.length === 0 && (
        <EmptyState
          icon="search-outline"
          title="No zones found"
          message={`Nothing matches “${q}”. Try another name.`}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md },
  sub: { marginTop: 4, marginBottom: spacing.lg },
  demo: { marginBottom: spacing.lg },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: spacing.lg,
  },
  search: { flex: 1, color: colors.text, fontSize: 15, fontFamily: 'Manrope_500Medium' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cellWrap: { width: '47%' },
  cell: { gap: 6 },
  cellIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
