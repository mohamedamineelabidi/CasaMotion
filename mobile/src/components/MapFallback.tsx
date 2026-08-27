import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { colors, radius, CASABLANCA } from '@/theme';
import { VehiclePosition } from '@/lib/types';
import { Text } from './ui/Text';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapCanvasProps {
  region?: MapRegion;
  vehicles?: VehiclePosition[];
  /** Fixed height; ignored when `fill` is set. */
  height?: number;
  /** Fill the parent container (flex:1). */
  fill?: boolean;
}

export function statusColor(status?: string): string {
  switch (status) {
    case 'available':
      return colors.ok;
    case 'busy':
      return colors.err;
    case 'enroute':
      return colors.warn;
    default:
      return colors.blue;
  }
}

/** SVG fallback map used on web and anywhere react-native-maps is unavailable. */
function FallbackSvg({
  region,
  vehicles,
  w,
  h,
}: {
  region: MapRegion;
  vehicles?: VehiclePosition[];
  w: number;
  h: number;
}) {
  const r = region;
  const points = useMemo(() => {
    if (w <= 0 || h <= 0) return [];
    return (vehicles ?? []).map((v) => {
      const x = ((v.lon - (r.longitude - r.longitudeDelta / 2)) / r.longitudeDelta) * w;
      const y = ((r.latitude + r.latitudeDelta / 2 - v.lat) / r.latitudeDelta) * h;
      return { x, y, color: statusColor(v.status), id: v.taxi_id };
    });
  }, [vehicles, r, w, h]);

  const grid = 6;
  if (w <= 0 || h <= 0) return null;
  return (
    <>
      <Svg width={w} height={h}>
        <Rect x={0} y={0} width={w} height={h} fill={colors.panel} />
        {Array.from({ length: grid + 1 }).map((_, i) => (
          <Line key={`v${i}`} x1={(w / grid) * i} y1={0} x2={(w / grid) * i} y2={h} stroke={colors.line} strokeWidth={1} />
        ))}
        {Array.from({ length: grid + 1 }).map((_, i) => (
          <Line key={`h${i}`} x1={0} y1={(h / grid) * i} x2={w} y2={(h / grid) * i} stroke={colors.line} strokeWidth={1} />
        ))}
        <Circle cx={w / 2} cy={h / 2} r={9} fill={colors.blue} opacity={0.15} />
        <Circle cx={w / 2} cy={h / 2} r={4} fill={colors.blue} />
        {points.map((p) =>
          p.x >= -6 && p.x <= w + 6 && p.y >= -6 && p.y <= h + 6 ? (
            <Circle key={p.id} cx={p.x} cy={p.y} r={5} fill={p.color} stroke={colors.white} strokeWidth={1.5} />
          ) : null,
        )}
      </Svg>
      <View style={styles.badge}>
        <Text variant="caption" color={colors.text3}>
          MAP PREVIEW
        </Text>
      </View>
    </>
  );
}

/** Full fallback canvas: measures its container and renders the SVG map. */
export function FallbackMapCanvas({ region, vehicles, height = 240, fill }: MapCanvasProps) {
  const activeRegion = region ?? CASABLANCA;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: hh } = e.nativeEvent.layout;
    setSize({ w: width, h: hh });
  };
  return (
    <View style={[styles.fallback, fill ? styles.fill : { height }]} onLayout={onLayout}>
      <FallbackSvg region={activeRegion} vehicles={vehicles} w={size.w} h={size.h} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  fallback: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
