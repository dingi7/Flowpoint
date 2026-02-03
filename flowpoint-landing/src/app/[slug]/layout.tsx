import { Providers } from "@/app/providers";
import { getLandingPageData } from "@/server/get-landing-page-data";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const rootDomain =
  process.env.ROOT_DOMAIN ||
  process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
  "flowpoint.services";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getLandingPageData(slug);

  if (!data) {
    return {
      robots: { index: false, follow: false },
    };
  }

  const { organization, landingPage } = data;
  const seo = landingPage.seo || {};
  const title = seo.title || organization.name;
  const description =
    seo.description ||
    `${organization.name} powered by Flowpoint.`;
  const canonicalHost = seo.canonicalHost || `${slug}.${rootDomain}`;
  const metadataBase = new URL(`https://${canonicalHost}`);

  return {
    title,
    description,
    keywords: seo.keywords,
    metadataBase,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: `https://${canonicalHost}`,
      siteName: organization.name,
      type: "website",
      images: seo.ogImageUrl ? [seo.ogImageUrl] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: seo.ogImageUrl ? [seo.ogImageUrl] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function TenantLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const data = await getLandingPageData(slug);

  if (!data) {
    notFound();
  }

  return (
    <Providers
      tenant={{
        organizationId: data.organization.id,
        organization: data.organization,
        landingPage: data.landingPage,
      }}
    >
      {children}
    </Providers>
  );
}
