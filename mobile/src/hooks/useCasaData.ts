import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createTrip as apiCreateTrip,
  fetchForecast as apiForecast,
  fetchZoneVehicles as apiVehicles,
  fetchZones as apiZones,
} from '@/lib/api';
import { CASA_ZONES } from '@/lib/config';
import { mockForecast, mockTrip, mockVehicles } from '@/lib/mock';
import { addTrip } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { LocalTrip, TripResponse } from '@/lib/types';

/** Zones: static list is always correct; try API to stay in sync, fall back. */
export function useZones() {
  const { backendOnline } = useAuth();
  return useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      if (!backendOnline) return CASA_ZONES;
      try {
        const z = await apiZones();
        return z.length ? z : CASA_ZONES;
      } catch {
        return CASA_ZONES;
      }
    },
    initialData: CASA_ZONES,
  });
}

export function useZoneVehicles(zoneId: number | null, limit = 40) {
  const { backendOnline } = useAuth();
  return useQuery({
    queryKey: ['vehicles', zoneId, limit, backendOnline],
    enabled: zoneId != null,
    refetchInterval: 6000,
    queryFn: async () => {
      const id = zoneId as number;
      if (!backendOnline) return mockVehicles(id, limit);
      try {
        return await apiVehicles(id, limit);
      } catch {
        return mockVehicles(id, limit);
      }
    },
  });
}

export function useForecast(zoneId: number, isoDatetime: string, enabled = true) {
  const { backendOnline } = useAuth();
  return useQuery({
    queryKey: ['forecast', zoneId, isoDatetime, backendOnline],
    enabled,
    queryFn: async () => {
      if (!backendOnline) return mockForecast(zoneId, isoDatetime);
      try {
        return await apiForecast(zoneId, isoDatetime);
      } catch {
        return mockForecast(zoneId, isoDatetime);
      }
    },
  });
}

export function useCreateTrip() {
  const { backendOnline, username } = useAuth();
  return useMutation({
    mutationFn: async (vars: { originZone: number; destZone: number }) => {
      const rider = username ?? 'rider';
      let res: TripResponse;
      let demo = false;
      if (!backendOnline) {
        res = mockTrip(vars.originZone, vars.destZone);
        demo = true;
      } else {
        try {
          res = await apiCreateTrip(rider, vars.originZone, vars.destZone);
        } catch {
          res = mockTrip(vars.originZone, vars.destZone);
          demo = true;
        }
      }
      const local: LocalTrip = {
        trip_id: res.trip_id,
        status: res.status,
        origin_zone: res.origin_zone,
        dest_zone: res.dest_zone,
        origin_name: res.origin_name,
        dest_name: res.dest_name,
        created_at: new Date().toISOString(),
        event_time: res.event_time,
        estimated_eta_sec: res.estimated_eta_sec,
        demo,
      };
      await addTrip(local);
      return local;
    },
  });
}
