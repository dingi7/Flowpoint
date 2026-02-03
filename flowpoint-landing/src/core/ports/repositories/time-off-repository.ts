import {
  GenericRepository,
  OrganizationIdPayload,
  TimeOff,
  TimeOffData,
} from "@/core";

export type TimeOffRepository = GenericRepository<
  TimeOff,
  TimeOffData,
  OrganizationIdPayload
>;
