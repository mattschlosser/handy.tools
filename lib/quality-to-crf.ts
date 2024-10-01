/**
 * Converts a slider value (0-100) to a CRF value (17-51) for ffmpeg.
 * @param {number} quality - The quality value from the slider (0-100).
 * @returns {number} - The corresponding CRF value (17-51).
 */
export const qualityToCrf = (quality: number): number => {
  // Ensure quality is within 0-100
  const clampedQuality = Math.min(Math.max(quality, 0), 100);

  // Map the slider value to a CRF value
  const crf = 51 - Math.round(clampedQuality / 100 * 34);

  // Round to the nearest integer
  return Math.round(crf);
};
