import { CASA_ZONES, zoneById } from './config';
import {
  ForecastResponse,
  TripResponse,
  VehiclePosition,
  ZoneVehiclesResponse,
} from './types';

/**
 * Deterministic-ish mock data used when the backend is unreachable (demo mode).
 * Mirrors the shape returned by api/main.py so screens don't branch on source.
 */

const STATUSES = ['available', 'available', 'available', 'busy', 'enroute'];

function seeded(n: number): number {
  // simple LCG-based pseudo-random in [0,1)
  const x = Math.sin(n * 999.13) * 43758.5453;
  return x - Math.floor(x);
}

export function mockVehicles(zoneId: number, limit = 12): ZoneVehiclesResponse {
  const zone = zoneById(zoneId) ?? CASA_ZONES[0];
  const count = Math.max(3, Math.round(4 + seeded(zoneId) * 12));
  const n = Math.min(limit, count);
  const now = Date.now();
  const vehicles: VehiclePosition[] = Array.from({ length: n }).map((_, i) => {
    const r = seeded(zoneId * 100 + i);
    const r2 = seeded(zoneId * 100 + i + 7);
    return {
      taxi_id: `CT-${String(zoneId).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
      event_time: new Date(now - Math.round(r * 45000)).toISOString(),
      lat: zone.lat + (r - 0.5) * 0.018,
      lon: zone.lon + (r2 - 0.5) * 0.018,
      speed_kmh: Math.round(r2 * 48),
      status: STATUSES[Math.floor(r * STATUSES.length)],
      h3_index: null,
    };
  });
  return {
    city: 'casablanca',
    zone_id: zone.zone_id,
    zone_name: zone.name,
    count,
    vehicles,
    degraded: true,
    degraded_reason: 'demo-mode (mock data)',
  };
}

const BASE_DEMAND: Record<number, number> = {
  0: 15, 1: 10, 2: 8, 3: 6, 4: 5, 5: 8, 6: 20, 7: 45, 8: 70, 9: 65, 10: 50,
  11: 55, 12: 60, 13: 65, 14: 70, 15: 55, 16: 50, 17: 65, 18: 70, 19: 55,
  20: 45, 21: 35, 22: 25, 23: 20,
};

export function mockForecast(zoneId: number, isoDatetime: string): ForecastResponse {
  const dt = new Date(isoDatetime);
  const hour = dt.getHours();
  const dow = dt.getDay();
  const isWeekend = dow === 0 || dow === 6;
  let demand = BASE_DEMAND[hour] ?? 30;
  if (isWeekend) demand *= 0.85;
  if ([8, 9, 14].includes(zoneId)) demand *= 1.3;
  else if ([1, 3, 16].includes(zoneId)) demand *= 0.7;
  const zone = zoneById(zoneId) ?? CASA_ZONES[0];
  return {
    zone_id: zoneId,
    zone_name: zone.name,
    datetime: dt.toISOString(),
    slot_of_day: hour * 2 + (dt.getMinutes() >= 30 ? 1 : 0),
    predicted_demand: Math.round(demand * 10) / 10,
    model_version: 'demo-heuristic',
  };
}

export function mockTrip(originZone: number, destZone: number): TripResponse {
  const o = zoneById(originZone) ?? CASA_ZONES[0];
  const d = zoneById(destZone) ?? CASA_ZONES[1];
  return {
    trip_id: `demo-${Date.now().toString(36)}`,
    status: 'queued',
    origin_zone: originZone,
    dest_zone: destZone,
    origin_name: o.name,
    dest_name: d.name,
    event_time: new Date().toISOString(),
    ingestion_topic: 'raw.trips',
    estimated_eta_sec: 180 + Math.round(seeded(originZone + destZone) * 420),
  };
}
