const GOOGLE_OAUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

interface BuildGoogleOAuthAuthorizationUrlPayload {
  clientId: string;
  redirectUri: string;
  state: string;
}

interface ExchangeCodeForGoogleTokensPayload {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface RefreshGoogleAccessTokenPayload {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
}

export function buildGoogleOAuthAuthorizationUrl(
  payload: BuildGoogleOAuthAuthorizationUrlPayload,
): string {
  const query = new URLSearchParams({
    client_id: payload.clientId,
    redirect_uri: payload.redirectUri,
    response_type: "code",
    scope: GOOGLE_CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: payload.state,
  });

  return `${GOOGLE_OAUTH_BASE_URL}?${query.toString()}`;
}

export async function exchangeCodeForGoogleTokens(
  payload: ExchangeCodeForGoogleTokensPayload,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code: payload.code,
    client_id: payload.clientId,
    client_secret: payload.clientSecret,
    redirect_uri: payload.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Failed to exchange Google OAuth code: ${data.error || response.statusText} ${data.error_description || ""}`.trim(),
    );
  }

  return data;
}

export async function refreshGoogleAccessToken(
  payload: RefreshGoogleAccessTokenPayload,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    refresh_token: payload.refreshToken,
    client_id: payload.clientId,
    client_secret: payload.clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      `Failed to refresh Google access token: ${data.error || response.statusText} ${data.error_description || ""}`.trim(),
    );
  }

  return data;
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USER_INFO_URL, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = (await response.json()) as GoogleUserInfo & {
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !data.email) {
    throw new Error(
      `Failed to retrieve Google user info: ${data.error || response.statusText} ${data.error_description || ""}`.trim(),
    );
  }

  return data;
}
