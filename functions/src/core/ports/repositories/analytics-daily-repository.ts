import {
  AnalyticsDaily,
  AnalyticsDailyData,
  GenericRepository,
  OrganizationIDPayload,
} from "@/core";

export type AnalyticsDailyRepository = GenericRepository<
  AnalyticsDaily,
  AnalyticsDailyData,
  OrganizationIDPayload
>;
