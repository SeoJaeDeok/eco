import type { Coordinates, MapBounds } from './mapTypes';

export const DEFAULT_MAP_CENTER: Coordinates = { lat: 35.8898, lng: 128.6106 };

export const DEFAULT_MAP_BOUNDS: MapBounds = {
  minLat: 35.8868,
  maxLat: 35.8902,
  minLng: 128.6052,
  maxLng: 128.6124,
};

export const clampPercent = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

export const createBoundsFromCoordinates = (coordinates: Coordinates[]) => {
  const valid = coordinates.filter((coords) => Number.isFinite(coords.lat) && Number.isFinite(coords.lng));
  if (!valid.length) return DEFAULT_MAP_BOUNDS;

  const lats = valid.map((coords) => coords.lat);
  const lngs = valid.map((coords) => coords.lng);

  return {
    minLat: Math.min(...lats, DEFAULT_MAP_BOUNDS.minLat),
    maxLat: Math.max(...lats, DEFAULT_MAP_BOUNDS.maxLat),
    minLng: Math.min(...lngs, DEFAULT_MAP_BOUNDS.minLng),
    maxLng: Math.max(...lngs, DEFAULT_MAP_BOUNDS.maxLng),
  };
};

export const projectCoordinatesToPercent = (coords: Coordinates, bounds = DEFAULT_MAP_BOUNDS) => {
  const x = ((coords.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = (1 - (coords.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;

  return {
    left: `${clampPercent(x, 6, 94)}%`,
    top: `${clampPercent(y, 10, 90)}%`,
  };
};

export const percentToCoordinates = (x: number, y: number, bounds = DEFAULT_MAP_BOUNDS): Coordinates => {
  return {
    lat: bounds.maxLat - y * (bounds.maxLat - bounds.minLat),
    lng: bounds.minLng + x * (bounds.maxLng - bounds.minLng),
  };
};
