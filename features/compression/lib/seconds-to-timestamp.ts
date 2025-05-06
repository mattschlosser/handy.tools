export function secondsToTimestamp(seconds: number): string {
  const date = new Date(0);
  date.setSeconds(seconds);
  try {
    return date.toISOString().slice(11, 19);
  } catch (e) {
    return "00:00:00";
  }
}