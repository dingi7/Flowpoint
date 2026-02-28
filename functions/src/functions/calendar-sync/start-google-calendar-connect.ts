import { ensureSelfMemberAccess } from "@/app/calendar-sync/authorization";
import { getFunctionUrl } from "@/app/calendar-sync/function-url";
import { createCalendarSyncOAuthState } from "@/app/calendar-sync/oauth-state-store";
import { createRandomToken } from "@/app/calendar-sync/helpers";
import { buildGoogleOAuthAuthorizationUrl } from "@/app/calendar-sync/google-oauth";
import { Secrets } from "@/config/secrets";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onCall } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const memberRepository = repositoryHost.getMemberRepository(databaseService);

const googleOAuthClientId = defineSecret(Secrets.GOOGLE_OAUTH_CLIENT_ID);

interface Payload {
  organizationId: string;
  returnUrl: string;
}

export const startGoogleCalendarConnect = onCall<Payload>(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [googleOAuthClientId],
  },
  async (request) => {
    if (!request.auth) {
      throw new Error("Unauthorized request");
    }

    const { organizationId, returnUrl } = request.data;
    if (!organizationId || !returnUrl) {
      throw new Error("organizationId and returnUrl are required");
    }

    // Validate return URL format early to avoid storing invalid callback state.
    const parsedReturnUrl = new URL(returnUrl);
    const memberId = await ensureSelfMemberAccess(
      {
        userId: request.auth.uid,
        organizationId,
      },
      { memberRepository },
    );

    const state = createRandomToken(24);
    await createCalendarSyncOAuthState({
      state,
      organizationId,
      userId: request.auth.uid,
      memberId,
      returnUrl: parsedReturnUrl.toString(),
    });

    const authUrl = buildGoogleOAuthAuthorizationUrl({
      clientId: googleOAuthClientId.value(),
      redirectUri: getFunctionUrl("googleCalendarOAuthCallback"),
      state,
    });

    loggerService.info("Generated Google OAuth URL for calendar sync", {
      organizationId,
      userId: request.auth.uid,
    });

    return { authUrl };
  },
);
