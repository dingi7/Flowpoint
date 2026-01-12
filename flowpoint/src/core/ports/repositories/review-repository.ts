import {
  GenericRepository,
  OrganizationIdPayload,
  Review,
  ReviewData,
} from "@/core";

export type ReviewRepository = GenericRepository<
  Review,
  ReviewData,
  OrganizationIdPayload
>;

