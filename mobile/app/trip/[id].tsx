import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Text, Tag, Button, EmptyState, IconButton } from '@/components/ui';
import { MapCanvas } from '@/components/MapCanvas';
import { useZoneVehicles } from '@/hooks/useCasaData';
import { getTrips } from '@/lib/store';
import { zoneById } from '@/lib/config';
import { LocalTrip } from '@/lib/types';
import { colors, radius, spacing } from '@/theme';

const STAGES = [
  { key: 'queued', label: 'Request received', icon: 'checkmark-circle' as const },
  { key: 'matching', label: 'Matching a driver', icon: 'search-circle' as const },
  { key: 'enroute', label: 'Driver on the way', icon: 'car-sport' as const },
  { key: 'arriving', label: 'Arriving now', icon: 'flag' as const },
];

export default function TripTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<LocalTrip | null | undefined>(undefined);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    getTrips().then((list) => setTrip(list.find((t) => t.trip_id === id) ?? null));
  }, [id]);

  // Simulate booking lifecycle locally (the API has no trip-status route).
  useEffect(() => {
    if (!trip) return;
    const timers = [
      setTimeout(() => setStage(1), 1500),
      setTimeout(() => setStage(2), 4000),
      setTimeout(() => setStage(3), 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [trip]);

  const originZone = trip ? zoneById(trip.origin_zone) : undefined;
  const vehiclesQ = useZoneVehicles(trip ? trip.origin_zone : null, 20);

  const region = useMemo(
    () =>
      originZone
        ? { latitude: originZone.lat, longitude: originZone.lon, latitudeDelta: 0.04, longitudeDelta: 0.04 }
        : undefined,
    [originZone],
  );

  const eta = trip?.estimated_eta_sec ?? 300;
  const etaMin = Math.max(1, Math.round((eta * (1 - stage / 4)) / 60));

  if (trip === undefined) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (trip === null) {
    return (
      <Screen edges={['top', 'bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          title="Trip not found"
          message="This trip is no longer available."
          action={<Button title="Back to home" onPress={() => router.replace('/(tabs)')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={<Button title="Done" variant="secondary" onPress={() => router.replace('/(tabs)/trips')} />}
    >
      <View style={styles.header}>
        <IconButton icon="chevron-back" onPress={() => router.replace('/(tabs)')} />
        <Text variant="h3">Your ride</Text>
        <Tag label={trip.demo ? 'demo' : 'live'} tone={trip.demo ? 'warn' : 'ok'} dot />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mapWrap}>
          <MapCanvas region={region} vehicles={vehiclesQ.data?.vehicles ?? []} height={220} />
        </View>

        <Card style={styles.etaCard}>
          <View>
            <Text variant="caption" color={colors.text3}>
              ESTIMATED ARRIVAL
            </Text>
            <Text variant="h1" color={colors.text}>
              {stage >= 3 ? 'Now' : `${etaMin} min`}
            </Text>
          </View>
          <View style={styles.etaIcon}>
            <Ionicons name="time" size={28} color={colors.white} />
          </View>
        </Card>

        <Card style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.pinCol}>
              <View style={styles.dotFrom} />
            </View>
            <Text variant="bodyStrong" style={styles.flex}>
              {trip.origin_name}
            </Text>
          </View>
          <View style={styles.connector} />
          <View style={styles.routeRow}>
            <View style={styles.pinCol}>
              <View style={styles.dotTo} />
            </View>
            <Text variant="bodyStrong" style={styles.flex}>
              {trip.dest_name}
            </Text>
          </View>
        </Card>

        <Text variant="title" style={styles.timelineTitle}>
          Status
        </Text>
        {STAGES.map((s, i) => {
          const done = i <= stage;
          const active = i === stage;
          return (
            <View key={s.key} style={styles.stageRow}>
              <View
                style={[
                  styles.stageIcon,
                  { backgroundColor: done ? colors.primary : colors.panel },
                ]}
              >
                <Ionicons
                  name={s.icon}
                  size={18}
                  color={done ? colors.white : colors.text3}
                />
              </View>
              <Text
                variant="bodyStrong"
                color={done ? colors.text : colors.text3}
                style={styles.flex}
              >
                {s.label}
              </Text>
              {active && i < 3 && <ActivityIndicator size="small" color={colors.primary} />}
              {done && !active && <Ionicons name="checkmark" size={18} color={colors.ok} />}
            </View>
          );
        })}

        <Text variant="mono" color={colors.text3} style={styles.tripId}>
          {trip.trip_id}
        </Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  flex: { flex: 1 },
  mapWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  etaCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  etaIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCard: { marginTop: spacing.md, gap: spacing.sm },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pinCol: { width: 22, alignItems: 'center' },
  dotFrom: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  dotTo: {
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  connector: { width: 2, height: 18, backgroundColor: colors.line, marginLeft: 10 },
  timelineTitle: { marginTop: spacing.xl, marginBottom: spacing.sm },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stageIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripId: { marginTop: spacing.lg, textAlign: 'center' },
});
