import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, Tag, DemoBadge, ZoneChip } from '@/components/ui';
import { MapCanvas } from '@/components/MapCanvas';
import { BottomSheetShell } from '@/components/BottomSheetShell';
import { useAuth } from '@/contexts/AuthContext';
import { useZoneVehicles, useZones } from '@/hooks/useCasaData';
import { zoneById } from '@/lib/config';
import { colors, radius, shadow, spacing } from '@/theme';

const FEATURED = [8, 14, 13, 9, 10, 4];

export default function Home() {
  const { username, demoMode } = useAuth();
  const { data: zones } = useZones();
  const [zoneId, setZoneId] = useState(8);
  const [expanded, setExpanded] = useState(false);
  const vehiclesQ = useZoneVehicles(zoneId, 40);

  const zone = zoneById(zoneId);
  const region = useMemo(
    () =>
      zone
        ? {
            latitude: zone.lat,
            longitude: zone.lon,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }
        : undefined,
    [zone],
  );

  const vehicles = vehiclesQ.data?.vehicles ?? [];
  const available = vehicles.filter((v) => v.status === 'available').length;

  return (
    <View style={styles.root}>
      <View style={styles.mapWrap}>
        <MapCanvas region={region} vehicles={vehicles} fill />
        <View style={styles.topBar}>
          <View>
            <Text variant="caption" color={colors.text3}>
              GOOD TO SEE YOU
            </Text>
            <Text variant="h3">{username ?? 'Rider'}</Text>
          </View>
          {demoMode && <DemoBadge compact />}
        </View>
      </View>

      <BottomSheetShell expanded={expanded} onToggle={setExpanded} collapsedHeight={340}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vehiclesQ.isFetching}
              onRefresh={() => vehiclesQ.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          {demoMode && (
            <View style={styles.demoWrap}>
              <DemoBadge />
            </View>
          )}

          <Pressable style={styles.search} onPress={() => router.push('/(tabs)/explore')}>
            <Ionicons name="search" size={20} color={colors.text3} />
            <Text variant="body" color={colors.text3} style={styles.flex}>
              Where to in Casablanca?
            </Text>
            <View style={styles.searchBtn}>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </View>
          </Pressable>

          <View style={styles.summary}>
            <View style={styles.stat}>
              <Text variant="h2" color={colors.text}>
                {vehiclesQ.data?.count ?? '—'}
              </Text>
              <Text variant="small" color={colors.text2}>
                taxis in {zone?.name}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text variant="h2" color={colors.ok}>
                {available}
              </Text>
              <Text variant="small" color={colors.text2}>
                available now
              </Text>
            </View>
          </View>

          <Text variant="smallStrong" color={colors.text2} style={styles.sectionLabel}>
            PICK A ZONE
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {FEATURED.map((id) => (
              <ZoneChip
                key={id}
                label={zoneById(id)?.name ?? `Zone ${id}`}
                selected={id === zoneId}
                onPress={() => setZoneId(id)}
              />
            ))}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={styles.action}
              onPress={() => router.push({ pathname: '/zone/[id]', params: { id: String(zoneId) } })}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.inkSoft }]}>
                <Ionicons name="car-sport" size={22} color={colors.text} />
              </View>
              <Text variant="smallStrong">Taxis nearby</Text>
            </Pressable>
            <Pressable
              style={styles.action}
              onPress={() => router.push('/forecast')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.inkSoft }]}>
                <Ionicons name="analytics" size={22} color={colors.text} />
              </View>
              <Text variant="smallStrong">Forecast</Text>
            </Pressable>
            <Pressable
              style={styles.action}
              onPress={() => router.push({ pathname: '/book/confirm', params: { origin: String(zoneId) } })}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={24} color={colors.white} />
              </View>
              <Text variant="smallStrong">Book ride</Text>
            </Pressable>
          </View>

          <View style={styles.listHead}>
            <Text variant="title">Live taxis</Text>
            <Tag
              label={vehiclesQ.data?.degraded ? 'simulated' : 'live'}
              tone={vehiclesQ.data?.degraded ? 'warn' : 'ok'}
              dot
            />
          </View>
          {vehicles.slice(0, 8).map((v) => (
            <View key={v.taxi_id} style={styles.vrow}>
              <View style={[styles.vdot, { backgroundColor: statusColor(v.status) }]} />
              <Text variant="bodyStrong" style={styles.flex}>
                {v.taxi_id}
              </Text>
              <Text variant="mono" color={colors.text2}>
                {Math.round(v.speed_kmh)} km/h
              </Text>
              <Text variant="smallStrong" color={statusColor(v.status)} style={styles.vstatus}>
                {v.status}
              </Text>
            </View>
          ))}
          <View style={{ height: 96 }} />
        </ScrollView>
      </BottomSheetShell>
    </View>
  );
}

function statusColor(status?: string): string {
  switch (status) {
    case 'available':
      return colors.ok;
    case 'busy':
      return colors.err;
    case 'enroute':
      return colors.warn;
    default:
      return colors.primary;
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  mapWrap: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 54,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow.md,
  },
  demoWrap: { marginBottom: spacing.md },
  flex: { flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panel,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingRight: 8,
    height: 56,
    marginBottom: spacing.lg,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1, height: 40, backgroundColor: colors.line },
  sectionLabel: { marginBottom: spacing.sm, letterSpacing: 0.6 },
  chips: { gap: 10, paddingBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  vrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.line2,
  },
  vdot: { width: 9, height: 9, borderRadius: 5 },
  vstatus: { width: 72, textAlign: 'right' },
});
