import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Screen, Card, Text, Tag, ZoneChip, IconButton } from '@/components/ui';
import { ForecastGauge } from '@/components/ForecastGauge';
import { useForecast, useZones } from '@/hooks/useCasaData';
import { zoneById } from '@/lib/config';
import { colors, radius, spacing } from '@/theme';

const HOURS = [7, 8, 12, 14, 17, 18, 21];

export default function ForecastScreen() {
  const { data: zones } = useZones();
  const [zoneId, setZoneId] = useState(8);
  const [hour, setHour] = useState(18);

  const iso = useMemo(() => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }, [hour]);

  const forecastQ = useForecast(zoneId, iso);
  const zone = zoneById(zoneId);

  return (
    <Screen scroll edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" onPress={() => router.back()} />
        <Text variant="h3">Demand forecast</Text>
        <View style={{ width: 42 }} />
      </View>

      <Text variant="body" color={colors.text2} style={styles.intro}>
        Predicted taxi demand per zone and time. Use it to pick a busier pickup
        area or avoid the rush.
      </Text>

      <Card style={styles.gaugeCard}>
        <View style={styles.gaugeHead}>
          <View>
            <Text variant="caption" color={colors.text3}>
              {zone?.name?.toUpperCase()}
            </Text>
            <Text variant="title">{hour}:00</Text>
          </View>
          <Tag
            label={forecastQ.data?.model_version === 'demo-heuristic' ? 'demo model' : 'model'}
            tone={forecastQ.data?.model_version === 'demo-heuristic' ? 'warn' : 'dark'}
            dot
          />
        </View>
        {forecastQ.data ? (
          <ForecastGauge value={forecastQ.data.predicted_demand} />
        ) : (
          <Text variant="body" color={colors.text3}>
            Loading…
          </Text>
        )}
      </Card>

      <Text variant="smallStrong" color={colors.text2} style={styles.label}>
        ZONE
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {(zones ?? []).map((z) => (
          <ZoneChip
            key={z.zone_id}
            label={z.name}
            selected={z.zone_id === zoneId}
            onPress={() => setZoneId(z.zone_id)}
          />
        ))}
      </ScrollView>

      <Text variant="smallStrong" color={colors.text2} style={styles.label}>
        TIME OF DAY
      </Text>
      <View style={styles.hours}>
        {HOURS.map((h) => (
          <Pressable
            key={h}
            onPress={() => setHour(h)}
            style={({ pressed }) => [
              styles.hour,
              h === hour && styles.hourOn,
              { transform: [{ scale: pressed ? 0.96 : 1 }] },
            ]}
          >
            <Text variant="bodyStrong" color={h === hour ? colors.white : colors.text2}>
              {h}:00
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  intro: { marginBottom: spacing.lg },
  gaugeCard: { gap: spacing.lg, marginBottom: spacing.xl },
  gaugeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: { marginBottom: spacing.sm, marginTop: spacing.sm, letterSpacing: 0.6 },
  chips: { gap: 10, paddingBottom: spacing.lg },
  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hour: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hourOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
