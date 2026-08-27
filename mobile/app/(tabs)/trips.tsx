import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Text, Tag, Button, EmptyState } from '@/components/ui';
import { getTrips } from '@/lib/store';
import { LocalTrip } from '@/lib/types';
import { colors, radius, spacing } from '@/theme';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export default function Trips() {
  const [trips, setTrips] = useState<LocalTrip[]>([]);

  useFocusEffect(
    useCallback(() => {
      getTrips().then(setTrips);
    }, []),
  );

  return (
    <Screen scroll edges={['top']}>
      <Text variant="h1" style={styles.title}>
        Your trips
      </Text>
      <Text variant="body" color={colors.text2} style={styles.sub}>
        Trip history is stored privately on this device.
      </Text>

      {trips.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="No trips yet"
          message="Your booked rides will show up here."
          action={
            <Button title="Book your first ride" onPress={() => router.push('/book/confirm')} />
          }
        />
      ) : (
        trips.map((t) => (
          <Pressable
            key={t.trip_id}
            style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            onPress={() => router.push({ pathname: '/trip/[id]', params: { id: t.trip_id } })}
          >
            <Card style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.route}>
                  <View style={styles.dotFrom} />
                  <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
                    {t.origin_name}
                  </Text>
                </View>
                <Tag label={t.demo ? 'demo' : t.status} tone={t.demo ? 'warn' : 'dark'} />
              </View>
              <View style={styles.connector} />
              <View style={styles.route}>
                <View style={styles.dotTo} />
                <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
                  {t.dest_name}
                </Text>
              </View>
              <View style={styles.foot}>
                <Text variant="small" color={colors.text3}>
                  {timeAgo(t.created_at)}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text3} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md },
  sub: { marginTop: 4, marginBottom: spacing.lg },
  card: { gap: spacing.sm, marginBottom: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  route: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dotFrom: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  dotTo: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: colors.surface,
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  flex: { flex: 1 },
  connector: { width: 2, height: 14, backgroundColor: colors.line, marginLeft: 4 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line2,
  },
});
