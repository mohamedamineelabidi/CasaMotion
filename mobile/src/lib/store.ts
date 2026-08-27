import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalTrip, SavedPlace } from './types';

const TRIPS_KEY = 'casamotion.trips';
const PLACES_KEY = 'casamotion.places';
const ONBOARD_KEY = 'casamotion.onboarded';

export async function getTrips(): Promise<LocalTrip[]> {
  try {
    const raw = await AsyncStorage.getItem(TRIPS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as LocalTrip[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function addTrip(trip: LocalTrip): Promise<LocalTrip[]> {
  const list = await getTrips();
  const next = [trip, ...list].slice(0, 100);
  await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(next));
  return next;
}

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(PLACES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedPlace[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function addSavedPlace(place: SavedPlace): Promise<SavedPlace[]> {
  const list = await getSavedPlaces();
  if (list.some((p) => p.id === place.id)) return list;
  const next = [...list, place];
  await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(next));
  return next;
}

export async function removeSavedPlace(id: string): Promise<SavedPlace[]> {
  const list = await getSavedPlaces();
  const next = list.filter((p) => p.id !== id);
  await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(next));
  return next;
}

export async function isOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARD_KEY)) === '1';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARD_KEY, '1');
}
