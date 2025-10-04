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