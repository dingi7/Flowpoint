import {
  AnalyticsDaily,
  AnalyticsDailyData,
  AnalyticsDailyRepository,
  DatabaseService,
  OrganizationIDPayload,
} from "@/core";
import { DatabaseCollection } from "./config";
import { getGenericRepository } from "./generic-repository";

export function getAnalyticsDailyRepository(
  databaseService: DatabaseService,
): AnalyticsDailyRepository {
  return getGenericRepository<
    AnalyticsDaily,
    AnalyticsDailyData,
    OrganizationIDPayload
  >(
    (payload) =>
      `${DatabaseCollection.ORGANIZATIONS}/${payload.organizationId}/${DatabaseCollection.ANALYTICS_DAILY}`,
    databaseService,
  );
}
