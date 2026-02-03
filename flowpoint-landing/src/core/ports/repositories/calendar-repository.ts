import {
  Calendar,
  CalendarData,
  GenericRepository,
  OrganizationIdPayload,
} from "@/core";

export type CalendarRepository = GenericRepository<
  Calendar,
  CalendarData,
  OrganizationIdPayload
>;
