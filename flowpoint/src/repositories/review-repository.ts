import {
  DatabaseService,
  OrganizationIdPayload,
  Review,
  ReviewData,
  ReviewRepository,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getReviewRepository(
  databaseService: DatabaseService,
): ReviewRepository {
  return getGenericRepository<
    Review,
    ReviewData,
    OrganizationIdPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.REVIEWS}`,
    databaseService,
  );
}

