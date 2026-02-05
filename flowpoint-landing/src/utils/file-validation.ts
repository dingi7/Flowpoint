import { ErrorBase } from "./error-base";

export type FileValidationErrorNames =
  | "maxFileSize"
  | "allowedFileTypes"
  | "emptyFile";

export class FileValidationError extends ErrorBase<FileValidationErrorNames> {}

export interface FileValidationConfig {
  maxFileSize: number;
  allowedFileTypes: string[];
}

const defaultConfig: FileValidationConfig = {
  maxFileSize: 1024 * 1024 * 2, // 2MB
  allowedFileTypes: [
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "video/mp4",
    "video/webm",
  ],
};

export type ValidValidationResult = {
  isValid: true;
  error: null;
};

export type InvalidValidationResult = {
  isValid: false;
  error: FileValidationError;
};

export type ValidationResult = ValidValidationResult | InvalidValidationResult;

export interface ValidationPayload {
  file: File | Blob;
  config?: FileValidationConfig;
}

/**
 * Validates file based on provided config
 *
 * @param {ValidationPayload} payload
 * @return {ValidationResult}
 */
export function validateFile(payload: ValidationPayload): ValidationResult {
  const { file, config = defaultConfig } = payload;
  const { size, type } = file;

  if (!size) {
    return {
      isValid: false,
      error: new FileValidationError("emptyFile", "File is empty"),
    };
  }

  if (size > config.maxFileSize) {
    return {
      isValid: false,
      error: new FileValidationError("maxFileSize", "File is too big"),
    };
  }

  if (!config.allowedFileTypes.includes(type)) {
    return {
      isValid: false,
      error: new FileValidationError(
        "allowedFileTypes",
        "File type is not allowed",
      ),
    };
  }

  return {
    isValid: true,
    error: null,
  };
}
