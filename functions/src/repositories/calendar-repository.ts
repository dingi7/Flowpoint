import {
  Calendar,
  CalendarData,
  CalendarRepository,
  DatabaseService,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getCalendarRepository(
  databaseService: DatabaseService,
): CalendarRepository {
  return getGenericRepository<Calendar, CalendarData>(
    () => DatabaseCollection.CALENDARS,
    databaseService,
  );
}
