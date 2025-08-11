import {
  GenericRepository,
  OrganizationIDPayload,
  TimeOff,
  TimeOffData,
} from "@/core";

export type TimeOffRepository = GenericRepository<
  TimeOff,
  TimeOffData,
  OrganizationIDPayload
>;
