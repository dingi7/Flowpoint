import { useFileUpload } from "../file-upload/use-file-upload";

export function useServiceImageUpload() {
  return useFileUpload({
    path: `service-images`,
    fileValidationConfig: {
      allowedFileTypes: ["image/gif", "image/jpeg", "image/png", "image/webp"],
      maxFileSize: 1024 * 1024 * 5, // 5MB
    },
  });
}
