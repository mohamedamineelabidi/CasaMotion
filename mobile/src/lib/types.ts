// Domain types mirroring api/main.py response models.

export type Role = 'rider' | 'admin';

export interface Zone {
  zone_id: number;
  name: string;
  lat: number;
  lon: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ForecastResponse {
  zone_id: number;
  zone_name: string;
  datetime: string;
  slot_of_day: number;
  predicted_demand: number;
  model_version: string;
}

export interface VehiclePosition {
  taxi_id: string;
  event_time: string;
  lat: number;
  lon: number;
  speed_kmh: number;
  status: string;
  h3_index?: string | null;
}

export interface ZoneVehiclesResponse {
  city: string;
  zone_id: number;
  zone_name: string;
  count: number;
  vehicles: VehiclePosition[];
  degraded: boolean;
  degraded_reason?: string | null;
}

export interface TripResponse {
  trip_id: string;
  status: string;
  origin_zone: number;
  dest_zone: number;
  origin_name: string;
  dest_name: string;
  event_time?: string | null;
  ingestion_topic?: string | null;
  estimated_eta_sec?: number | null;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  zones: number;
  version: string;
}

// Local-only record persisted in AsyncStorage (the API has no trip list route).
export interface LocalTrip {
  trip_id: string;
  status: string;
  origin_zone: number;
  dest_zone: number;
  origin_name: string;
  dest_name: string;
  created_at: string; // ISO
  event_time?: string | null;
  estimated_eta_sec?: number | null;
  demo: boolean; // true when created against mock data
}

export interface SavedPlace {
  id: string;
  label: string;
  zone_id: number;
  zone_name: string;
}
