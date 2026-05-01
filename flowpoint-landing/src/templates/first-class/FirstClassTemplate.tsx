import Header from "./components/Header";
import Footer from "./components/Footer";
import { BookingModalRoot } from "@/app/components/booking/BookingModalRoot";
import { HeroSection } from "./sections/HeroSection";
import { Services } from "./sections/Services";
import Team from "./sections/Team";
import { Testimonials } from "./sections/Testimonials";
import Location from "./sections/Location";
import { TemplateProps } from "../types";
import Script from "next/script";

export function FirstClassTemplate({
  organization,
  landingPage,
  services,
  members,
}: TemplateProps) {
  const showAiMirror = Boolean(
    landingPage.aiMirror?.enabled && landingPage.aiMirror?.hasGeminiKey,
  );
  const copyOverrides = landingPage.copyOverrides || {};
  const hero = landingPage.hero || {};
  const branding = landingPage.branding || {};
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN ||
    process.env.ROOT_DOMAIN ||
    "flowpoint.services";
  const canonicalHost =
    landingPage.seo?.canonicalHost ||
    (organization.slug ? `${organization.slug}.${rootDomain}` : rootDomain);
  const canonicalUrl = `https://${canonicalHost}`;
  const contactInfo = organization.settings?.contactInfo || {};
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: organization.name,
    image:
      landingPage.seo?.ogImageUrl ||
      hero.backgroundImageUrl ||
      branding.logoUrl ||
      organization.image,
    url: canonicalUrl,
    telephone: contactInfo.phone,
    address: contactInfo.address
      ? {
          "@type": "PostalAddress",
          streetAddress: contactInfo.address,
        }
      : undefined,
  };

  return (
    <>
      <Header
        logoUrl={branding.logoUrl || organization.image}
        organizationName={organization.name}
      />
      <main className="flex-grow">
        <HeroSection
          title={hero.title}
          subtitle={hero.subtitle}
          ctaLabel={hero.ctaLabel}
          backgroundVideoUrl={hero.backgroundVideoUrl}
          backgroundImageUrl={hero.backgroundImageUrl}
        />
        <Services services={services} title={copyOverrides.servicesTitle} />
        <Team
          members={members}
          title={copyOverrides.teamTitle}
          subtitle={copyOverrides.teamSubtitle}
        />
        <Testimonials
          imageUrls={landingPage.gallery?.imageUrls || []}
          title={copyOverrides.galleryTitle}
        />
        <Location organization={organization} landingPage={landingPage} />
      </main>
      <Footer organization={organization} landingPage={landingPage} />
      <BookingModalRoot showAiMirror={showAiMirror} />
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </>
  );
}
