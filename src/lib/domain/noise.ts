export const NOISE_THRESHOLDS = {
  DANGER: 75,
  WARNING: 65,
  SAFE: 55,
} as const;

export type NoiseCategory = "DANGER" | "WARNING" | "SAFE" | "UNKNOWN";

/**
 * Calculates the expected sound pressure level (dB) at a given distance from the source.
 * Formula: L2 = L1 - 20 * log10(r2 / r1), assuming r1 = 1m.
 * Edge cases:
 * - If distance <= 0, it is clamped to 1 meter.
 * - If distance or sourceDb is NaN/Infinity, returns NaN.
 */
export function calculateDbAtDistance(sourceDb: number, distanceMeters: number): number {
  if (!Number.isFinite(sourceDb) || !Number.isFinite(distanceMeters)) return NaN;
  
  const r2 = Math.max(1, distanceMeters); // Clamp to at least 1 meter
  return sourceDb - 20 * Math.log10(r2);
}

/**
 * Calculates the radius (in meters) where the sound pressure level reaches a specific threshold.
 * Formula: r2 = 10 ^ ((sourceDb - targetDb) / 20)
 */
export function calculateRadiusForThreshold(sourceDb: number, targetDb: number): number {
  if (!Number.isFinite(sourceDb) || !Number.isFinite(targetDb)) return NaN;
  if (targetDb > sourceDb) return 1; // Sound is already below threshold at source
  
  return Math.pow(10, (sourceDb - targetDb) / 20);
}

/**
 * Determines the noise category based on the dB level.
 */
export function getNoiseCategory(dbLevel: number): NoiseCategory {
  if (!Number.isFinite(dbLevel)) return "UNKNOWN";
  
  if (dbLevel >= NOISE_THRESHOLDS.DANGER) return "DANGER";
  if (dbLevel >= NOISE_THRESHOLDS.WARNING) return "WARNING";
  return "SAFE";
}
