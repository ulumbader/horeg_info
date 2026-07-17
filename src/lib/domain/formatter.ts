export interface DistanceFormatterOptions {
  thresholdMeters?: number; // Distance at which to switch to km (default: 1000)
  fractionDigits?: number; // Number of decimal places for km (default: 1)
}

/**
 * Formats a distance in meters to a human-readable string (m or km).
 * @param distanceMeters The distance in meters.
 * @param options Formatting options.
 * @returns Formatted string (e.g., "500 m", "1.5 km"). Returns "N/A" for NaN.
 */
export function formatDistance(distanceMeters: number, options?: DistanceFormatterOptions): string {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) {
    return "N/A";
  }

  const threshold = options?.thresholdMeters ?? 1000;
  const digits = options?.fractionDigits ?? 1;

  if (distanceMeters < threshold) {
    return `${Math.round(distanceMeters)} m`;
  }

  const km = distanceMeters / 1000;
  
  // Format with specified fraction digits, stripping trailing zeros if perfectly round
  const formattedKm = parseFloat(km.toFixed(digits));
  
  return `${formattedKm} km`;
}
