import axios, { AxiosInstance } from 'axios';
import { apiRoot, config } from './config';
import { getToken } from './auth';
import {
  ForecastResponse,
  HealthResponse,
  Role,
  TokenResponse,
  TripResponse,
  Zone,
  ZoneVehiclesResponse,
} from './types';

let client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (client) return client;
  client = axios.create({
    baseURL: apiRoot,
    timeout: config.requestTimeoutMs,
    headers: { 'Content-Type': 'application/json' },
  });
  client.interceptors.request.use(async (cfg) => {
    const token = await getToken();
    if (token) {
      cfg.headers = cfg.headers ?? {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
    return cfg;
  });
  return client;
}

/** Probe the public /health route. Resolves false on any network/HTTP error. */
export async function probeHealth(): Promise<HealthResponse | null> {
  try {
    const { data } = await getClient().get<HealthResponse>('/health', {
      timeout: 4000,
    });
    return data;
  } catch {
    return null;
  }
}

export async function login(username: string, role: Role): Promise<TokenResponse> {
  const { data } = await getClient().post<TokenResponse>('/auth/token', {
    username,
    role,
  });
  return data;
}

export async function fetchZones(): Promise<Zone[]> {
  const { data } = await getClient().get<Zone[]>('/zones');
  return data;
}

export async function fetchZoneVehicles(
  zoneId: number,
  limit = 50,
): Promise<ZoneVehiclesResponse> {
  const { data } = await getClient().get<ZoneVehiclesResponse>(
    `/vehicles/${zoneId}`,
    { params: { limit } },
  );
  return data;
}

export async function fetchForecast(
  zoneId: number,
  isoDatetime: string,
): Promise<ForecastResponse> {
  const { data } = await getClient().post<ForecastResponse>('/demand/forecast', {
    zone_id: zoneId,
    datetime: isoDatetime,
  });
  return data;
}

export async function createTrip(
  riderId: string,
  originZone: number,
  destZone: number,
): Promise<TripResponse> {
  const { data } = await getClient().post<TripResponse>('/trips', {
    rider_id: riderId,
    origin_zone: originZone,
    dest_zone: destZone,
  });
  return data;
}
