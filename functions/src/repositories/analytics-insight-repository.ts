import {
  AnalyticsInsight,
  AnalyticsInsightData,
  AnalyticsInsightRepository,
  DatabaseService,
  OrganizationIDPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getAnalyticsInsightRepository(
  databaseService: DatabaseService,
): AnalyticsInsightRepository {
  return getGenericRepository<
    AnalyticsInsight,
    AnalyticsInsightData,
    OrganizationIDPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.ANALYTICS_INSIGHTS}`,
    databaseService,
  );
}
