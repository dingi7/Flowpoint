import {
  Calendar,
  CalendarData,
  GenericRepository,
  OrganizationIDPayload,
} from "@/core";

export type CalendarRepository = GenericRepository<
  Calendar,
  CalendarData,
  OrganizationIDPayload
>;
