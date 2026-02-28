export function getFunctionsBaseUrl(): string {
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "";
  const region = process.env.FUNCTION_REGION || process.env.LOCATION || "us-central1";

  if (!projectId) {
    throw new Error("Missing GCLOUD_PROJECT/GCP_PROJECT");
  }

  return `https://${region}-${projectId}.cloudfunctions.net`;
}

export function getFunctionUrl(functionName: string): string {
  return `${getFunctionsBaseUrl()}/${functionName}`;
}
