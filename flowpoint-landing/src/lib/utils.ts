import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a time slot from UTC ISO string to local time display format (HH:MM AM/PM)
 * The ISO string is expected to be in UTC, and this function converts it to local time for display
 */
export function formatTimeSlot(isoString: string): string {
  // Parse the UTC ISO string - JavaScript Date automatically handles UTC to local conversion
  const date = new Date(isoString);
  
  // getHours() and getMinutes() already return local time values
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Generate calendar days for a given month and year
 */
export function generateCalendarDays(month: number, year: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];

  // Add empty slots for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(day: number | null, month: number, year: number): boolean {
  if (!day) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(year, month, day);
  selectedDate.setHours(0, 0, 0, 0);
  return selectedDate < today;
}

/**
 * Navigate to the previous or next month
 */
export function navigateMonth(
  direction: 'prev' | 'next',
  currentMonth: number,
  currentYear: number
): { newMonth: number; newYear: number } {
  let newMonth = currentMonth;
  let newYear = currentYear;

  if (direction === 'prev') {
    if (currentMonth === 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    } else {
      newMonth = currentMonth - 1;
    }
  } else {
    if (currentMonth === 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    } else {
      newMonth = currentMonth + 1;
    }
  }

  return { newMonth, newYear };
}
