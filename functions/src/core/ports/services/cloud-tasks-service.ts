export interface ScheduleTaskPayload {
  payload: Record<string, unknown>;
  scheduleTime: Date;
  url?: string; // Optional - will be auto-generated if not provided
}

export interface CloudTasksService {
  scheduleTask(payload: ScheduleTaskPayload): Promise<string>;
}
