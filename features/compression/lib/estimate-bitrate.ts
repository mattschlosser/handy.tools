export function estimateBitrate(
  crf: number,
  resolution: { width: number; height: number },
  fps: number
): number {
  // Base bitrate in kbps for 1080p at CRF 23 and 30fps
  const baseBitrate = 5000;

  // Adjust for CRF (example scaling)
  const crfAdjustment = Math.pow(23 / crf, 1.5);

  // Adjust for resolution (assuming 1080p is the base)
  const resolutionAdjustment =
    (resolution.height * resolution.width) / (1920 * 1080);

  // Adjust for frame rate (assuming 30fps is the base)
  const fpsAdjustment = fps / 30;

  // Estimated bitrate
  const estimatedBitrate =
    baseBitrate * crfAdjustment * resolutionAdjustment * fpsAdjustment;

  return estimatedBitrate; // in kbps
}
