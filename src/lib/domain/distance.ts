/**
 * Calculates the great-circle distance between two points on the Earth's surface using the Haversine formula.
 * @returns Distance in meters. Returns NaN if coordinates are invalid.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2) ||
    Math.abs(lat1) > 90 ||
    Math.abs(lat2) > 90 ||
    Math.abs(lon1) > 180 ||
    Math.abs(lon2) > 180
  ) {
    return NaN;
  }

  const R = 6371e3; // Earth radius in meters
  const toRad = (value: number) => (value * Math.PI) / 180;
  
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
