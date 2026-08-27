import { Zone } from './types';

/**
 * Runtime configuration. EXPO_PUBLIC_* vars are inlined at build time by Expo.
 */
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const config = {
  // Host + port of the FastAPI backend. The "/api" path is appended by the client.
  apiBaseUrl: (rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl : 'http://localhost:8000').replace(/\/+$/, ''),
  apiPrefix: '/api',
  googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY?.trim() || '',
  requestTimeoutMs: 8000,
};

export const apiRoot = `${config.apiBaseUrl}${config.apiPrefix}`;

/**
 * The 16 Casablanca zones with coordinates. Matches the fallback catalogue in
 * api/main.py (_ZONE_FALLBACK) so the app works offline / in demo mode.
 */
export const CASA_ZONES: Zone[] = [
  { zone_id: 1, name: 'Ain Chock', lat: 33.5266, lon: -7.6216 },
  { zone_id: 2, name: 'Sidi Othmane', lat: 33.5583, lon: -7.5613 },
  { zone_id: 3, name: 'Sidi Moumen', lat: 33.5838, lon: -7.5004 },
  { zone_id: 4, name: 'Hay Hassani', lat: 33.5465, lon: -7.6803 },
  { zone_id: 5, name: 'Sbata', lat: 33.5358, lon: -7.558 },
  { zone_id: 6, name: 'Ben Msik', lat: 33.5414, lon: -7.565 },
  { zone_id: 7, name: 'Moulay Rachid', lat: 33.5685, lon: -7.54 },
  { zone_id: 8, name: 'Maarif', lat: 33.5704, lon: -7.6325 },
  { zone_id: 9, name: 'Al Fida', lat: 33.5652, lon: -7.5949 },
  { zone_id: 10, name: 'Mers Sultan', lat: 33.5775, lon: -7.6015 },
  { zone_id: 11, name: 'Roches Noires', lat: 33.5925, lon: -7.594 },
  { zone_id: 12, name: 'Hay Mohammadi', lat: 33.582, lon: -7.5575 },
  { zone_id: 13, name: 'Anfa', lat: 33.595, lon: -7.6525 },
  { zone_id: 14, name: 'Sidi Belyout', lat: 33.5985, lon: -7.6149 },
  { zone_id: 15, name: 'Ain Sebaa', lat: 33.605, lon: -7.585 },
  { zone_id: 16, name: 'Sidi Bernoussi', lat: 33.615, lon: -7.515 },
];

export const zoneById = (id: number): Zone | undefined =>
  CASA_ZONES.find((z) => z.zone_id === id);
