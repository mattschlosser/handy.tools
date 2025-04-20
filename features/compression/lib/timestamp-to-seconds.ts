/**
 * Converts a timestamp string in the format "HH:MM:SS", "MM:SS", or "SS" to seconds.
 * @param timestamp - The timestamp string to convert
 * @returns The total number of seconds represented by the timestamp
 * @throws Error if the timestamp format is invalid
 * @example
 * // returns 3661
 * timestampToSeconds("01:01:01");
 * // returns 61
 * timestampToSeconds("01:01");
 * // returns 1
 * timestampToSeconds("01");
 */
export const timestampToSeconds = (timestamp: string): number => {
    const parts = timestamp.split(":").map(Number);
    let seconds = 0;
    
    if (parts.length === 3) {
        seconds += parts[0] * 3600; // hours
        seconds += parts[1] * 60;   // minutes
        seconds += parts[2];        // seconds
    } else if (parts.length === 2) {
        seconds += parts[0] * 60;   // minutes
        seconds += parts[1];        // seconds
    } else if (parts.length === 1) {
        seconds += parts[0];        // seconds
    }
    
    return seconds;
}