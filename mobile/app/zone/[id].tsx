import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Text, Tag, Button, EmptyState, IconButton } from '@/components/ui';
import { MapCanvas } from '@/components/MapCanvas';
import { useZoneVehicles } from '@/hooks/useCasaData';
import { zoneById } from '@/lib/config';
import { colors, radius, spacing } from '@/theme';

function statusTone(status: string): 'ok' | 'err' | 'warn' | 'neutral' {
  if (status === 'available') return 'ok';
  if (status === 'busy') return 'err';
  if (status === 'enroute') return 'warn';
  return 'neutral';
}

export default function ZoneDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const zoneId = Number(id) || 1;
  const zone = zoneById(zoneId);
  const vehiclesQ = useZoneVehicles(zoneId, 60);

  const region = useMemo(
    () =>
      zone
        ? { latitude: zone.lat, longitude: zone.lon, latitudeDelta: 0.045, longitudeDelta: 0.045 }
        : undefined,
    [zone],
  );

  const vehicles = vehiclesQ.data?.vehicles ?? [];

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Button
          title="Book a ride from here"
          onPress={() =>
            router.push({ pathname: '/book/confirm', params: { origin: String(zoneId) } })
          }
        />
      }
    >
      <View style={styles.header}>
        <IconButton icon="chevron-back" onPress={() => router.back()} />
        <Text variant="h3" numberOfLines={1} style={styles.flex}>
          {zone?.name ?? `Zone ${zoneId}`}
        </Text>
        <Tag
          label={vehiclesQ.data?.degraded ? 'simulated' : 'live'}
          tone={vehiclesQ.data?.degraded ? 'warn' : 'ok'}
          dot
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mapWrap}>
          <MapCanvas region={region} vehicles={vehicles} height={220} />
        </View>

        <View style={styles.stats}>
          <Card style={styles.stat}>
            <Text variant="h2" color={colors.text}>
              {vehiclesQ.data?.count ?? '—'}
            </Text>
            <Text variant="small" color={colors.text2}>
              total taxis
            </Text>
          </Card>
          <Card style={styles.stat}>
            <Text variant="h2" color={colors.ok}>
              {vehicles.filter((v) => v.status === 'available').length}
            </Text>
            <Text variant="small" color={colors.text2}>
              available
            </Text>
          </Card>
        </View>

        <Text variant="title" style={styles.listTitle}>
          Taxis in this zone
        </Text>

        {vehicles.length === 0 ? (
          <EmptyState
            icon="car-outline"
            title="No taxis right now"
            message="Try again in a moment or pick a nearby zone."
          />
        ) : (
          vehicles.map((v) => (
            <View key={v.taxi_id} style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name="car-sport" size={18} color={colors.text} />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyStrong">{v.taxi_id}</Text>
                <Text variant="small" color={colors.text2}>
                  {Math.round(v.speed_kmh)} km/h
                </Text>
              </View>
              <Tag label={v.status} tone={statusTone(v.status)} />
            </View>
          ))
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  flex: { flex: 1 },
  mapWrap: { borderRadius: radius.lg, overflow: 'hidden' },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  listTitle: { marginTop: spacing.xl, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.inkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
