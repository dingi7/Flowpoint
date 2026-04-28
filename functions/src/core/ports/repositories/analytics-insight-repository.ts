import {
  AnalyticsInsight,
  AnalyticsInsightData,
  GenericRepository,
  OrganizationIDPayload,
} from "@/core";

export type AnalyticsInsightRepository = GenericRepository<
  AnalyticsInsight,
  AnalyticsInsightData,
  OrganizationIDPayload
>;
