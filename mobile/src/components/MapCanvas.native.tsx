import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, CASABLANCA } from '@/theme';
import {
  FallbackMapCanvas,
  MapCanvasProps,
  statusColor,
} from './MapFallback';

export type { MapRegion, MapCanvasProps } from './MapFallback';

// Load the native maps module. In Expo Go (managed) this native module isn't
// present, so we gracefully fall back to the SVG canvas. A real map appears in
// a development/production build that includes react-native-maps.
let MapView: any = null;
let Marker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maps = require('react-native-maps');
  MapView = maps.default ?? maps.MapView;
  Marker = maps.Marker;
} catch {
  MapView = null;
}

export function MapCanvas({ region, vehicles, height = 240, fill }: MapCanvasProps) {
  const activeRegion = region ?? CASABLANCA;

  if (!MapView) {
    return <FallbackMapCanvas region={region} vehicles={vehicles} height={height} fill={fill} />;
  }

  return (
    <View style={[styles.native, fill ? styles.fill : { height }]}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={activeRegion}>
        {(vehicles ?? []).map((v) => (
          <Marker
            key={v.taxi_id}
            coordinate={{ latitude: v.lat, longitude: v.lon }}
            title={v.taxi_id}
            description={`${v.status} · ${Math.round(v.speed_kmh)} km/h`}
            pinColor={statusColor(v.status)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  native: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.panel },
});
