import { buildDefaultCalendarSyncConnectionData } from "@/app/calendar-sync/connection-utils";
import { getFunctionUrl } from "@/app/calendar-sync/function-url";
import { createRandomToken, hashToken } from "@/app/calendar-sync/helpers";
import { consumeCalendarSyncOAuthState } from "@/app/calendar-sync/oauth-state-store";
import { exchangeCodeForGoogleTokens, getGoogleUserInfo } from "@/app/calendar-sync/google-oauth";
import { CALENDAR_SYNC_BACKFILL_STATUS, CALENDAR_SYNC_CONNECTION_STATUS } from "@/core";
import { Secrets } from "@/config/secrets";
import { repositoryHost } from "@/repositories";
import { serviceHost } from "@/services";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

const databaseService = serviceHost.getDatabaseService();
const loggerService = serviceHost.getLoggerService();
const secretManagerService = serviceHost.getSecretManagerService({
  loggerService,
});
const calendarSyncConnectionRepository =
  repositoryHost.getCalendarSyncConnectionRepository(databaseService);
const memberRepository = repositoryHost.getMemberRepository(databaseService);

const googleOAuthClientId = defineSecret(Secrets.GOOGLE_OAUTH_CLIENT_ID);
const googleOAuthClientSecret = defineSecret(Secrets.GOOGLE_OAUTH_CLIENT_SECRET);

function sanitizeSecretSuffix(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function buildRedirectUrl(returnUrl: string, status: "success" | "error", reason?: string): string {
  const url = new URL(returnUrl);
  url.searchParams.set("calendarSync", status);
  if (reason) {
    url.searchParams.set("calendarSyncReason", reason);
  } else {
    url.searchParams.delete("calendarSyncReason");
  }
  return url.toString();
}

export const googleCalendarOAuthCallback = onRequest(
  {
    invoker: "public",
    ingressSettings: "ALLOW_ALL",
    secrets: [googleOAuthClientId, googleOAuthClientSecret],
  },
  async (req, res) => {
    const state = req.query.state as string | undefined;
    const code = req.query.code as string | undefined;
    const providerError = req.query.error as string | undefined;

    if (!state) {
      res.status(400).send("Missing OAuth state");
      return;
    }

    const oauthState = await consumeCalendarSyncOAuthState(state);
    if (!oauthState) {
      res.status(400).send("Invalid or expired OAuth state");
      return;
    }

    if (providerError) {
      res.redirect(buildRedirectUrl(oauthState.returnUrl, "error", providerError));
      return;
    }

    if (!code) {
      res.redirect(buildRedirectUrl(oauthState.returnUrl, "error", "missing_code"));
      return;
    }

    try {
      const member = await memberRepository.get({
        organizationId: oauthState.organizationId,
        id: oauthState.memberId,
      });

      if (!member) {
        throw new Error("Member no longer exists in organization");
      }

      const tokenResponse = await exchangeCodeForGoogleTokens({
        code,
        clientId: googleOAuthClientId.value(),
        clientSecret: googleOAuthClientSecret.value(),
        redirectUri: getFunctionUrl("googleCalendarOAuthCallback"),
      });

      if (!tokenResponse.refresh_token) {
        throw new Error(
          "Google did not return a refresh token. Reconnect with consent.",
        );
      }

      const googleUser = await getGoogleUserInfo(tokenResponse.access_token);

      const existingConnection = await calendarSyncConnectionRepository.get({
        organizationId: oauthState.organizationId,
        id: oauthState.memberId,
      });

      if (existingConnection?.googleRefreshTokenSecretId) {
        await secretManagerService
          .deleteSecret(existingConnection.googleRefreshTokenSecretId)
          .catch(() => undefined);
      }
      if (existingConnection?.icsTokenSecretId) {
        await secretManagerService
          .deleteSecret(existingConnection.icsTokenSecretId)
          .catch(() => undefined);
      }

      const secretSuffix = sanitizeSecretSuffix(
        `${oauthState.organizationId}_${oauthState.memberId}_${createRandomToken(10)}`,
      );
      const refreshTokenSecretId = `gcal_rt_${secretSuffix}`;
      const icsTokenSecretId = `ics_tok_${secretSuffix}`;
      const rawIcsToken = createRandomToken(32);

      await secretManagerService.createSecret(
        refreshTokenSecretId,
        tokenResponse.refresh_token,
      );
      await secretManagerService.createSecret(icsTokenSecretId, rawIcsToken);

      const defaultData = buildDefaultCalendarSyncConnectionData({
        organizationId: oauthState.organizationId,
        memberId: oauthState.memberId,
        userId: oauthState.userId,
      });

      await calendarSyncConnectionRepository.set({
        organizationId: oauthState.organizationId,
        id: oauthState.memberId,
        data: {
          ...defaultData,
          syncEnabled: true,
          status: CALENDAR_SYNC_CONNECTION_STATUS.CONNECTED,
          googleCalendarId: "primary",
          googleRefreshTokenSecretId: refreshTokenSecretId,
          googleAccountEmail: googleUser.email,
          icsTokenSecretId,
          icsTokenHash: hashToken(rawIcsToken),
          appBaseUrl: new URL(oauthState.returnUrl).origin,
          backfillStatus: CALENDAR_SYNC_BACKFILL_STATUS.PENDING,
          lastError: "",
        },
      });

      const cloudTasksService = serviceHost.getCloudTasksService(
        "syncMemberCalendarBackfill",
        "calendar-sync",
      );

      await cloudTasksService.scheduleTask({
        payload: {
          organizationId: oauthState.organizationId,
          memberId: oauthState.memberId,
        },
        scheduleTime: new Date(Date.now() + 5000),
      });

      res.redirect(buildRedirectUrl(oauthState.returnUrl, "success"));
    } catch (error) {
      loggerService.error("Google Calendar OAuth callback failed", {
        state: oauthState.state,
        organizationId: oauthState.organizationId,
        userId: oauthState.userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      res.redirect(
        buildRedirectUrl(
          oauthState.returnUrl,
          "error",
          "oauth_callback_failed",
        ),
      );
    }
  },
);
