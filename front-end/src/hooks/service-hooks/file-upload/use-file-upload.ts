import { useCallback, useState } from "react";

import type { UploadMetadata } from "@firebase/storage";

import type { UploadError, UploadPayload, UploadTask } from "@/core";
import { serviceHost } from "@/services";
import { FileValidationConfig, FileValidationError, validateFile } from "@/utils/file-validation";
import { generateSHA256Hash } from "@/utils/file-hash";

const fileUploadService = serviceHost.getFileUploadService();

export interface FileUploadConfig {
  path: string;
  fileValidationConfig?: FileValidationConfig;
  metadata?: UploadMetadata;
}

export interface FileUploadTaskAndState extends UploadTask {
  uploadFile: (file: UploadPayload["file"]) => void;
  uploadProgress: number;
  isLoading: boolean;
  isComplete: boolean;
  isCancelled: boolean;
  isPaused: boolean;
  error: FileValidationError | UploadError | null;
  setError: (error: FileValidationError | UploadError | null) => void;
  url: string | null;
}

export function useFileUpload(
  config: FileUploadConfig,
): FileUploadTaskAndState {
  const [task, setTask] = useState<UploadTask | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<FileValidationError | UploadError | null>(
    null,
  );
  const [isCancelled, setIsCancelled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: UploadPayload["file"]) => {
      const { isValid, error: validationError } = validateFile({
        file,
        config: config.fileValidationConfig,
      });

      if (!isValid) {
        setError(validationError);
        return;
      }

      const fileHash = await generateSHA256Hash(file);
      let extension = "";
      if (file.name) {
        const parts = file.name.split(".");
        if (parts.length > 1) {
          extension = `.${parts[parts.length - 1]}`;
        }
      }

      const hashWithExt = `${fileHash}${extension}`;

      const task = fileUploadService.uploadFile({
        path: `${config.path}/${hashWithExt}`,
        file: file,
        metadata: config.metadata,
        progressCallback: (progress: number) => {
          setUploadProgress(progress);
        },
        onPaused: () => {
          setIsPaused(true);
        },
        onRunning: () => {
          setIsPaused(false);
        },
        onCanceled: () => {
          setIsCancelled(true);
        },
        onError: (error: UploadError) => {
          setError(error);
        },
        onComplete: (url: string) => {
          setIsComplete(true);
          setUrl(url);
        },
      });

      setTask(task);
    },
    [config.fileValidationConfig, config.path],
  );

  if (!task) {
    return {
      uploadFile,
      uploadProgress: 0,
      isComplete: false,
      isLoading: false,
      error: null,
      isCancelled: false,
      isPaused: false,
      setError: () => undefined,
      url: null,
      pause: () => undefined,
      resume: () => undefined,
      cancel: () => undefined,
    };
  }

  return {
    uploadFile,
    uploadProgress,
    isLoading:
      !isComplete &&
      !error &&
      !isCancelled &&
      !isPaused &&
      uploadProgress > 0 &&
      uploadProgress < 100,
    isComplete,
    error,
    isCancelled,
    isPaused,
    setError,
    url,
    ...task,
  };
}

