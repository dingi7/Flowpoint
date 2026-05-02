const AI_MIRROR_SECRET_PREFIX = "ai_mirror_gemini";

export function buildAiMirrorSecretId(payload: { organizationId: string }): string {
  return `${AI_MIRROR_SECRET_PREFIX}_${payload.organizationId}`;
}
