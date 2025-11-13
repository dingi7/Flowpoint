import { LoggerService } from "@/core";

const SOFIA_TIMEZONE = "Europe/Sofia";

/**
 * Get timezone from IP address using ipapi.co
 * Falls back to Sofia timezone if IP lookup fails
 */
export async function getTimezoneFromIp(
  ip: string | null | undefined,
  loggerService: LoggerService,
): Promise<string> {
  if (!ip) {
    loggerService.info("No IP address provided, using Sofia timezone");
    return SOFIA_TIMEZONE;
  }

  // Skip localhost/private IPs
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("172.20.") ||
    ip.startsWith("172.21.") ||
    ip.startsWith("172.22.") ||
    ip.startsWith("172.23.") ||
    ip.startsWith("172.24.") ||
    ip.startsWith("172.25.") ||
    ip.startsWith("172.26.") ||
    ip.startsWith("172.27.") ||
    ip.startsWith("172.28.") ||
    ip.startsWith("172.29.") ||
    ip.startsWith("172.30.") ||
    ip.startsWith("172.31.")
  ) {
    loggerService.info("Private/local IP detected, using Sofia timezone", { ip });
    return SOFIA_TIMEZONE;
  }

  try {
    // Use ipapi.co free tier (1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/timezone/`, {
      headers: {
        "User-Agent": "CRM-Appointment-System/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`IP geolocation API returned ${response.status}`);
    }

    const timezone = await response.text();

    if (!timezone || timezone.trim() === "" || timezone.includes("error")) {
      throw new Error("Invalid timezone response from API");
    }

    loggerService.info("Timezone detected from IP", { ip, timezone });
    return timezone.trim();
  } catch (error) {
    loggerService.warn("Failed to get timezone from IP, using Sofia fallback", {
      ip,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return SOFIA_TIMEZONE;
  }
}

/**
 * Extract client IP address from Firebase Functions request
 */
export function getClientIp(request: {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
}): string | null {
  // Check X-Forwarded-For header (first IP is the original client)
  const forwardedFor = request.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    if (ips) {
      return ips.split(",")[0].trim();
    }
  }

  // Check X-Real-IP header
  const realIp = request.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to request.ip
  if (request.ip) {
    return request.ip;
  }

  return null;
}

