import z from "zod";
import { baseEntitySchema } from "./base";
import { DAY_OF_WEEK } from "./calendar";

export enum ANALYTICS_INSIGHT_TYPE {
  UNDERBOOKED_PERIOD = "underbooked_period",
  PEAK_PERIOD = "peak_period",
  NO_SHOW_RATE = "no_show_rate",
}

export enum ANALYTICS_INSIGHT_SEVERITY {
  INFO = "info",
  WARNING = "warning",
  OPPORTUNITY = "opportunity",
}

export const analyticsMetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  bookings: z.number(),
  completedBookings: z.number(),
  cancelledBookings: z.number(),
  noShowBookings: z.number(),
  revenue: z.number(),
  bookedMinutes: z.number(),
});

export type AnalyticsMetric = z.infer<typeof analyticsMetricSchema>;

export const analyticsCustomerValueSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  completedBookings: z.number(),
  revenue: z.number(),
});

export type AnalyticsCustomerValue = z.infer<
  typeof analyticsCustomerValueSchema
>;

export const analyticsHourBucketSchema = z.object({
  dayOfWeek: z.nativeEnum(DAY_OF_WEEK),
  hour: z.number().int().min(0).max(23),
  bookings: z.number(),
  completedBookings: z.number(),
  cancelledBookings: z.number(),
  noShowBookings: z.number(),
  revenue: z.number(),
  bookedMinutes: z.number(),
  availableMinutes: z.number(),
  utilizationRate: z.number(),
});

export type AnalyticsHourBucket = z.infer<typeof analyticsHourBucketSchema>;

export const analyticsDailyDataSchema = z.object({
  date: z.string(),
  timezone: z.string(),
  periodStartAt: z.string(),
  periodEndAt: z.string(),
  totalBookings: z.number(),
  completedBookings: z.number(),
  cancelledBookings: z.number(),
  noShowBookings: z.number(),
  totalRevenue: z.number(),
  bookedMinutes: z.number(),
  availableMinutes: z.number(),
  utilizationRate: z.number(),
  activeCustomerCount: z.number(),
  repeatCustomerCount: z.number(),
  retentionRate: z.number(),
  averageCustomerLifetimeValue: z.number(),
  revenueByService: z.record(z.string(), analyticsMetricSchema),
  revenueByEmployee: z.record(z.string(), analyticsMetricSchema),
  customerLifetimeValue: z.record(z.string(), analyticsCustomerValueSchema),
  hourBuckets: z.record(z.string(), analyticsHourBucketSchema),
});

export type AnalyticsDailyData = z.infer<typeof analyticsDailyDataSchema>;
export const analyticsDailySchema =
  baseEntitySchema.merge(analyticsDailyDataSchema);
export type AnalyticsDaily = z.infer<typeof analyticsDailySchema>;

export const analyticsInsightDataSchema = z.object({
  type: z.nativeEnum(ANALYTICS_INSIGHT_TYPE),
  severity: z.nativeEnum(ANALYTICS_INSIGHT_SEVERITY),
  message: z.string(),
  recommendation: z.string(),
  metric: z.number().optional(),
  dayOfWeek: z.nativeEnum(DAY_OF_WEEK).optional(),
  startHour: z.number().int().min(0).max(23).optional(),
  endHour: z.number().int().min(1).max(24).optional(),
  generatedAt: z.string(),
  periodStartAt: z.string(),
  periodEndAt: z.string(),
});

export type AnalyticsInsightData = z.infer<typeof analyticsInsightDataSchema>;
export const analyticsInsightSchema =
  baseEntitySchema.merge(analyticsInsightDataSchema);
export type AnalyticsInsight = z.infer<typeof analyticsInsightSchema>;

export interface AnalyticsDashboardSummary {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  noShowRate: number;
  utilizationRate: number;
  retentionRate: number;
  averageCustomerLifetimeValue: number;
  activeCustomerCount: number;
  repeatCustomerCount: number;
}

export interface AnalyticsDashboardResponse {
  periodStartAt: string;
  periodEndAt: string;
  timezone: string;
  summary: AnalyticsDashboardSummary;
  revenueByService: AnalyticsMetric[];
  revenueByEmployee: AnalyticsMetric[];
  topCustomersByLifetimeValue: AnalyticsCustomerValue[];
  hourBuckets: AnalyticsHourBucket[];
  insights: AnalyticsInsight[];
}
