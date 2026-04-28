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

export interface AnalyticsMetric {
  id: string;
  name: string;
  bookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  revenue: number;
  bookedMinutes: number;
}

export interface AnalyticsCustomerValue {
  id: string;
  name: string;
  email?: string;
  completedBookings: number;
  revenue: number;
}

export interface AnalyticsHourBucket {
  dayOfWeek: DAY_OF_WEEK;
  hour: number;
  bookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  revenue: number;
  bookedMinutes: number;
  availableMinutes: number;
  utilizationRate: number;
}

export interface AnalyticsInsight {
  id: string;
  type: ANALYTICS_INSIGHT_TYPE;
  severity: ANALYTICS_INSIGHT_SEVERITY;
  message: string;
  recommendation: string;
  metric?: number;
  dayOfWeek?: DAY_OF_WEEK;
  startHour?: number;
  endHour?: number;
  generatedAt: string;
  periodStartAt: string;
  periodEndAt: string;
  createdAt: Date;
  updatedAt: Date;
}

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
