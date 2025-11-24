import { ErrorBase } from "@/utils/error-base";
import type { UploadMetadata } from "@firebase/storage";

type UploadErrorName = "unauthorized" | "unknown";

export class UploadError extends ErrorBase<UploadErrorName> {}

export interface UploadPayload {
  path: string;
  file: File;
  progressCallback: (progress: number) => void;
  onPaused: () => void;
  onRunning: () => void;
  onCanceled: () => void;
  onError: (error: UploadError) => void;
  onComplete: (url: string) => void;
  metadata?: UploadMetadata;
}

export interface UploadTask {
  pause: () => void;
  resume: () => void;
  cancel: () => void;
}

export interface FileUploadService {
  uploadFile: (payload: UploadPayload) => UploadTask;
}
