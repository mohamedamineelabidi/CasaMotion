import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Card, Text, Button, Tag, IconButton } from '@/components/ui';
import { useCreateTrip, useZones } from '@/hooks/useCasaData';
import { zoneById } from '@/lib/config';
import { colors, radius, spacing } from '@/theme';

export default function ConfirmBooking() {
  const params = useLocalSearchParams<{ origin?: string }>();
  const { data: zones } = useZones();
  const [origin, setOrigin] = useState(Number(params.origin) || 8);
  const [dest, setDest] = useState<number | null>(null);
  const [picking, setPicking] = useState<'origin' | 'dest'>('dest');
  const createTrip = useCreateTrip();

  const originZone = zoneById(origin);
  const destZone = dest ? zoneById(dest) : null;

  const confirm = async () => {
    if (!dest) {
      Alert.alert('Choose a destination', 'Select where you want to go.');
      return;
    }
    if (dest === origin) {
      Alert.alert('Pick a different destination', 'Origin and destination cannot match.');
      return;
    }
    try {
      const trip = await createTrip.mutateAsync({ originZone: origin, destZone: dest });
      router.replace({ pathname: '/trip/[id]', params: { id: trip.trip_id } });
    } catch {
      Alert.alert('Booking failed', 'Could not queue the trip. Please try again.');
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Button
          title={dest ? `Confirm ride to ${destZone?.name}` : 'Select a destination'}
          onPress={confirm}
          loading={createTrip.isPending}
          disabled={!dest}
        />
      }
    >
      <View style={styles.header}>
        <Text variant="h2">Book a ride</Text>
        <IconButton icon="close" onPress={() => router.back()} elevated={false} />
      </View>

      <Card style={styles.route}>
        <Pressable style={styles.routeRow} onPress={() => setPicking('origin')}>
          <View style={styles.pinCol}>
            <View style={styles.dotFrom} />
          </View>
          <View style={styles.flex}>
            <Text variant="caption" color={colors.text3}>
              FROM
            </Text>
            <Text variant="bodyStrong">{originZone?.name}</Text>
          </View>
          {picking === 'origin' && <Tag label="selecting" tone="dark" />}
        </Pressable>
        <View style={styles.line} />
        <Pressable style={styles.routeRow} onPress={() => setPicking('dest')}>
          <View style={styles.pinCol}>
            <View style={styles.dotTo} />
          </View>
          <View style={styles.flex}>
            <Text variant="caption" color={colors.text3}>
              TO
            </Text>
            <Text variant="bodyStrong" color={destZone ? colors.text : colors.text3}>
              {destZone?.name ?? 'Choose destination'}
            </Text>
          </View>
          {picking === 'dest' && <Tag label="selecting" tone="dark" />}
        </Pressable>
      </Card>

      <Text variant="smallStrong" color={colors.text2} style={styles.label}>
        {picking === 'origin' ? 'SELECT PICKUP ZONE' : 'SELECT DESTINATION ZONE'}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.flex}>
        <View style={styles.grid}>
          {(zones ?? []).map((z) => {
            const active = picking === 'origin' ? z.zone_id === origin : z.zone_id === dest;
            return (
              <Pressable
                key={z.zone_id}
                style={({ pressed }) => [
                  styles.cell,
                  active && styles.cellOn,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
                onPress={() => {
                  if (picking === 'origin') {
                    setOrigin(z.zone_id);
                    setPicking('dest');
                  } else {
                    setDest(z.zone_id);
                  }
                }}
              >
                <Text
                  variant="smallStrong"
                  color={active ? colors.white : colors.text}
                  numberOfLines={1}
                >
                  {z.name}
                </Text>
                <Text variant="caption" color={active ? colors.white : colors.text3}>
                  ZONE {z.zone_id}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  flex: { flex: 1 },
  route: { gap: spacing.sm, marginBottom: spacing.lg },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pinCol: { width: 24, alignItems: 'center' },
  dotFrom: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.primary },
  dotTo: {
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  line: { width: 2, height: 18, backgroundColor: colors.line, marginLeft: 11 },
  label: { marginBottom: spacing.sm, letterSpacing: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: {
    width: '47%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 3,
  },
  cellOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
