import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export function convertUtcTimeToLocal(utcTime: string) {
    // Use today's date for conversion
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const today = new Date();
    const [hour, minute] = utcTime.split(":").map(Number);
    // Create a UTC date with today's date and the given time
    const utcDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), hour, minute));
    // Convert to user's timezone
    const zonedDate = toZonedTime(utcDate, timezone);
    return format(zonedDate, "HH:mm");
}

export function convertLocalTimeToUtc(localTime: string) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = new Date(localTime);
    const zonedDate = fromZonedTime(date, timezone);
    return format(zonedDate, "HH:mm");
}

// Convert local time string to UTC time string
export function convertLocalTimeStringToUtc(localTimeString: string): string {
    // Create a date object for today
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Create a local datetime by parsing the time string
    const localDate = new Date(todayString + 'T' + localTimeString + ':00');
    
    // Get the timezone offset in minutes
    const timezoneOffset = localDate.getTimezoneOffset();
    
    // Convert to UTC by subtracting the offset
    const utcDate = new Date(localDate.getTime() + (timezoneOffset * 60000));
    const utcTimeString = format(utcDate, "HH:mm");
    
    return utcTimeString;
}

// Convert UTC datetime string to local timezone for display
export function convertUtcToLocal(utcDateTime: string): Date {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const utcDate = new Date(utcDateTime);
    return toZonedTime(utcDate, timezone);
}

// Convert local datetime to UTC for backend storage
export function convertLocalToUtc(localDateTime: Date): string {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const utcDate = fromZonedTime(localDateTime, timezone);
    return utcDate.toISOString();
}

// Format UTC datetime for display in local timezone
export function formatUtcDateTime(utcDateTime: string, formatString: string = "yyyy-MM-dd HH:mm"): string {
    const localDate = convertUtcToLocal(utcDateTime);
    return format(localDate, formatString);
}

// Create UTC datetime from local date and time strings
export function createUtcDateTime(dateString: string, timeString: string): string {
    const localDateTime = new Date(`${dateString}T${timeString}:00`);
    return convertLocalToUtc(localDateTime);
}

// Convert working hours from organization timezone to user's local timezone
export function convertWorkingHoursToLocal(workingHours: { start: string; end: string }, organizationTimezone: string): { start: string; end: string } {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Create a date for today to convert the times
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Convert start time from organization timezone to user's local timezone
    const startOrgTime = new Date(`${todayString}T${workingHours.start}:00`);
    const startUtc = fromZonedTime(startOrgTime, organizationTimezone);
    const startLocal = toZonedTime(startUtc, userTimezone);
    const startTime = format(startLocal, "HH:mm");
    
    // Convert end time from organization timezone to user's local timezone
    const endOrgTime = new Date(`${todayString}T${workingHours.end}:00`);
    const endUtc = fromZonedTime(endOrgTime, organizationTimezone);
    const endLocal = toZonedTime(endUtc, userTimezone);
    const endTime = format(endLocal, "HH:mm");
    
    return {
        start: startTime,
        end: endTime
    };
}

/**
 * Get start and end of day in ISO format for querying
 * This function ensures the date range is calculated correctly regardless of timezone
 * @param date - The date to get the range for
 * @returns Object with startOfDay and endOfDay as ISO strings in UTC
 */
export function getDateRangeForQuery(date: Date): { startOfDay: string; endOfDay: string } {
  // Get the date components - these are in local timezone
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Create start of day (00:00:00.000) in local timezone
  // This ensures we're working with the exact day the user selected
  const startOfDayLocal = new Date(year, month, day, 0, 0, 0, 0);
  
  // Create end of day (23:59:59.999) in local timezone
  const endOfDayLocal = new Date(year, month, day, 23, 59, 59, 999);

  // Convert to ISO strings (UTC)
  // The toISOString() will correctly convert the local time to UTC
  // This ensures we query for all appointments that fall within the selected day
  // regardless of timezone differences
  const startOfDayISO = startOfDayLocal.toISOString();
  const endOfDayISO = endOfDayLocal.toISOString();

  return { startOfDay: startOfDayISO, endOfDay: endOfDayISO };
}

/**
 * Normalize a date to noon (12:00:00) to avoid timezone conversion issues
 * This ensures the date represents the correct day regardless of timezone
 * @param year - The year
 * @param month - The month (0-indexed)
 * @param day - The day of the month
 * @returns A Date object set to noon on the specified date
 */
export function normalizeDateToNoon(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
}

/**
 * Format a date in long format (e.g., "Monday, January 15, 2024")
 * @param date - The date to format
 * @param locale - The locale to use (default: "en-US")
 * @returns Formatted date string
 */
export function formatLongDate(date: Date, locale: string = "en-US"): string {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Check if two dates are on the same day
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns True if both dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return isSameDay(date, today);
}