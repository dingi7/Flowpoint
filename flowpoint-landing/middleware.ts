import { NextRequest, NextResponse } from "next/server";

const rootDomain =
  process.env.ROOT_DOMAIN ||
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  "flowpoint.services";

function getSlugFromHost(host: string) {
  const hostname = host.split(":")[0];

  if (
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === "localhost"
  ) {
    return null;
  }

  if (hostname.endsWith(".localhost")) {
    return hostname.replace(".localhost", "");
  }

  if (hostname.endsWith(`.${rootDomain}`)) {
    return hostname.replace(`.${rootDomain}`, "");
  }

  return null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.next();
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
