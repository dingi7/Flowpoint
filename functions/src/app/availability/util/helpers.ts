import { DAY_OF_WEEK } from "@/core";

/**
 * Helper function to get day of week from date
 */
export function getDayOfWeek(date: Date): DAY_OF_WEEK {
  const days: DAY_OF_WEEK[] = [
    DAY_OF_WEEK.Sunday,
    DAY_OF_WEEK.Monday,
    DAY_OF_WEEK.Tuesday,
    DAY_OF_WEEK.Wednesday,
    DAY_OF_WEEK.Thursday,
    DAY_OF_WEEK.Friday,
    DAY_OF_WEEK.Saturday,
  ];
  return days[date.getDay()];
}

/**
 * Helper function to convert time string (HH:MM) to minutes
 */
export function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper function to check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && start2 < end1;
}