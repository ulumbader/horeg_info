export type MapPosition = [latitude: number, longitude: number];

export function getValidMapPosition(latitude: unknown, longitude: unknown): MapPosition | null {
  if (
    typeof latitude !== "number"
    || typeof longitude !== "number"
    || !Number.isFinite(latitude)
    || !Number.isFinite(longitude)
    || latitude < -90
    || latitude > 90
    || longitude < -180
    || longitude > 180
  ) {
    return null;
  }

  return [latitude, longitude];
}
