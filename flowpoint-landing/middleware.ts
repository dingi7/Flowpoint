import { NextRequest, NextResponse } from "next/server";

const rootDomain =
  process.env.ROOT_DOMAIN ||
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  "flowpoint.services";
const normalizedRootDomain = rootDomain.toLowerCase();

const projectLandingSubdomain = "landing";

function getHostname(host: string) {
  return host.split(":")[0].toLowerCase();
}

function isProjectLandingHost(host: string) {
  const hostname = getHostname(host);

  return (
    hostname === `${projectLandingSubdomain}.${normalizedRootDomain}` ||
    hostname === `${projectLandingSubdomain}.localhost`
  );
}

function getSlugFromHost(host: string) {
  const hostname = getHostname(host);

  if (
    hostname === normalizedRootDomain ||
    hostname === `www.${normalizedRootDomain}` ||
    hostname === "localhost"
  ) {
    return null;
  }

  if (hostname.endsWith(".localhost")) {
    return hostname.replace(".localhost", "");
  }

  if (hostname.endsWith(`.${normalizedRootDomain}`)) {
    return hostname.replace(`.${normalizedRootDomain}`, "");
  }

  return null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.next();
  }

  if (isProjectLandingHost(host)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.rewrite(url);
  }

  const slug = getSlugFromHost(host);

  if (!slug) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${slug}${request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
