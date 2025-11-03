/**
 * Utility functions for parsing and formatting time values for Jira worklog
 *
 * Jira uses specific time format for logging work:
 * - Minutes: "30m"
 * - Hours: "2h"
 * - Days: "1d"
 * - Weeks: "1w"
 * - Combined: "2h 30m", "1d 4h", etc.
 */

/**
 * Parse a time string into seconds
 *
 * Supported formats:
 * - "30m" -> 30 minutes -> 1800 seconds
 * - "2h" -> 2 hours -> 7200 seconds
 * - "1d" -> 1 day -> 28800 seconds (8 hour work day)
 * - "1w" -> 1 week -> 144000 seconds (40 hour work week)
 * - "2h 30m" -> 2.5 hours -> 9000 seconds
 * - "1d 4h 30m" -> 1 day 4.5 hours -> 44400 seconds
 *
 * @param timeString - The time string to parse (e.g., "2h 30m")
 * @returns Number of seconds, or null if invalid format
 */
export function parseTimeToSeconds(timeString: string): number | null {
    if (!timeString || typeof timeString !== 'string') {
        return null;
    }

    // Normalize the input: trim and lowercase
    const normalized = timeString.trim().toLowerCase();

    // Regex to match time components (e.g., "2h", "30m", "1d", "1w")
    const regex = /(\d+(?:\.\d+)?)\s*([wdhm])/g;

    let totalSeconds = 0;
    let hasMatch = false;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(normalized)) !== null) {
        hasMatch = true;
        const value = parseFloat(match[1]);
        const unit = match[2];

        if (isNaN(value) || value < 0) {
            return null; // Invalid number
        }

        switch (unit) {
            case 'w': // Weeks (40 hour work week)
                totalSeconds += value * 5 * 8 * 60 * 60; // 5 days * 8 hours
                break;
            case 'd': // Days (8 hour work day)
                totalSeconds += value * 8 * 60 * 60;
                break;
            case 'h': // Hours
                totalSeconds += value * 60 * 60;
                break;
            case 'm': // Minutes
                totalSeconds += value * 60;
                break;
            default:
                return null; // Unknown unit
        }
    }

    if (!hasMatch) {
        return null; // No valid time components found
    }

    return Math.round(totalSeconds);
}

/**
 * Format seconds into a Jira-compatible time string
 *
 * @param seconds - Number of seconds
 * @returns Formatted time string (e.g., "2h 30m")
 */
export function formatSecondsToTime(seconds: number): string {
    if (!seconds || seconds < 0) {
        return '0m';
    }

    const weeks = Math.floor(seconds / (5 * 8 * 60 * 60));
    seconds -= weeks * (5 * 8 * 60 * 60);

    const days = Math.floor(seconds / (8 * 60 * 60));
    seconds -= days * (8 * 60 * 60);

    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * (60 * 60);

    const minutes = Math.floor(seconds / 60);

    const parts: string[] = [];
    if (weeks > 0) {
        parts.push(`${weeks}w`);
    }
    if (days > 0) {
        parts.push(`${days}d`);
    }
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }

    return parts.length > 0 ? parts.join(' ') : '0m';
}

/**
 * Validate a time string format
 *
 * @param timeString - The time string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTimeString(timeString: string): string | null {
    if (!timeString || typeof timeString !== 'string') {
        return 'Time string is required';
    }

    const trimmed = timeString.trim();
    if (trimmed.length === 0) {
        return 'Time string cannot be empty';
    }

    const seconds = parseTimeToSeconds(trimmed);
    if (seconds === null) {
        return 'Invalid time format. Use formats like: "2h", "30m", "2h 30m", "1d 4h"';
    }

    if (seconds === 0) {
        return 'Time must be greater than 0';
    }

    return null; // Valid
}
