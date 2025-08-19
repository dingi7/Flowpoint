import { TimeOff, TimeOffData, GenericRepository, OrganizationIdPayload } from "@/core";

export type TimeOffRepository = GenericRepository<
  TimeOff,
  TimeOffData,
  OrganizationIdPayload
>;
