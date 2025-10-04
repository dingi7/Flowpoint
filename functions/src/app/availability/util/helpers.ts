import { DAY_OF_WEEK } from "@/core";

/**
 * Helper function to get day of week from date
 */
export function getDayOfWeek(date: Date): DAY_OF_WEEK {
  const days: DAY_OF_WEEK[] = [
    DAY_OF_WEEK.SUNDAY,
    DAY_OF_WEEK.MONDAY,
    DAY_OF_WEEK.TUESDAY,
    DAY_OF_WEEK.WEDNESDAY,
    DAY_OF_WEEK.THURSDAY,
    DAY_OF_WEEK.FRIDAY,
    DAY_OF_WEEK.SATURDAY,
  ];
  return days[date.getDay()];
}

/**
 * Helper function to convert time string (HH:MM) to minutes
 */
export function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Helper function to check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 < end2 && start2 < end1;
}
