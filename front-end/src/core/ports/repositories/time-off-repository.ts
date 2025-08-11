import { TimeOff, TimeOffData, GenericRepository, OrganizationIDPayload } from "@/core";

export type TimeOffRepository = GenericRepository<
  TimeOff,
  TimeOffData,
  OrganizationIDPayload
>;
