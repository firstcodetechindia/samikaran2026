import { useState, useCallback } from "react";

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata: UploadMetadata;
}

export type UploadFolder =
  | "studentsprofile"
  | "students-id"
  | "samikaran-asstes/images"
  | "samikaran-asstes/css"
  | "samikaran-asstes/scripts"
  | "samikaran-asstes/docs"
  | "uploads";

interface UseUploadOptions {
  folder?: UploadFolder;
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const directUpload = useCallback(
    async (file: File, folder: UploadFolder = "uploads"): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/uploads/direct", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error("Upload blocked by server — nginx limit is ~1MB. Fix: add 'client_max_body_size 15m;' to your nginx config and restart nginx.");
        }
        if (response.status === 415) {
          throw new Error("File type not supported. Please upload a JPG or PNG image.");
        }
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Upload failed (${response.status})`);
        }
        throw new Error(`Upload failed. Server returned status ${response.status}. Please try a smaller file.`);
      }

      return response.json();
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File, overrideFolder?: UploadFolder): Promise<UploadResponse | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      const folder = overrideFolder || options.folder || "uploads";

      try {
        setProgress(20);
        const uploadResponse = await directUpload(file, folder);
        setProgress(100);
        options.onSuccess?.(uploadResponse);
        return uploadResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Upload failed");
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [directUpload, options]
  );

  return {
    uploadFile,
    isUploading,
    error,
    progress,
  };
}
