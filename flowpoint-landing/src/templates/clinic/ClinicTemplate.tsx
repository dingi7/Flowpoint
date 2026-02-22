import Header from "./components/Header";
import Footer from "./components/Footer";
import { BookingModalRoot } from "@/app/components/booking/BookingModalRoot";
import { HeroSection } from "./sections/HeroSection";
import { Services } from "./sections/Services";
import { AboutUs } from "./sections/AboutUs";
import Team from "./sections/Team";
import { Testimonials } from "./sections/Testimonials";
import { Gallery } from "./sections/Gallery";
import Location from "./sections/Location";
import { TemplateProps } from "../types";
import Script from "next/script";

export function ClinicTemplate({
  organization,
  landingPage,
  services,
  members,
}: TemplateProps) {
  const copyOverrides = landingPage.copyOverrides || {};
  const hero = landingPage.hero || {};
  const branding = landingPage.branding || {};
  const primaryColor = branding.primaryColor || "#0f766e";
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
    "@type": "MedicalBusiness",
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
      {/* Load Playfair Display font */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&display=swap"
        rel="stylesheet"
      />
      <div className="bg-white text-slate-900 min-h-screen">
        <Header
          logoUrl={branding.logoUrl || organization.image}
          organizationName={organization.name}
          primaryColor={primaryColor}
        />
        <main className="flex-grow">
          <HeroSection
            title={hero.title}
            subtitle={hero.subtitle}
            ctaLabel={hero.ctaLabel}
            backgroundVideoUrl={hero.backgroundVideoUrl}
            backgroundImageUrl={hero.backgroundImageUrl}
            primaryColor={primaryColor}
          />
          <Services services={services} title={copyOverrides.servicesTitle} primaryColor={primaryColor} />
          <AboutUs
            title={landingPage.aboutUs?.title}
            description={landingPage.aboutUs?.description}
            patientsServed={landingPage.aboutUs?.patientsServed}
            specialists={landingPage.aboutUs?.specialists}
            yearsOfService={landingPage.aboutUs?.yearsOfService}
            patientSatisfaction={landingPage.aboutUs?.patientSatisfaction}
            bullets={landingPage.aboutUs?.bullets}
            primaryColor={primaryColor}
          />
          <Team
            members={members}
            title={copyOverrides.teamTitle}
            subtitle={copyOverrides.teamSubtitle}
            primaryColor={primaryColor}
          />
          <Gallery
            imageUrls={landingPage.gallery?.imageUrls || []}
            title={copyOverrides.galleryTitle}
            primaryColor={primaryColor}
          />
          <Testimonials
            items={landingPage.testimonials?.items}
            primaryColor={primaryColor}
          />
          <Location organization={organization} landingPage={landingPage} primaryColor={primaryColor} />
        </main>
        <Footer organization={organization} landingPage={landingPage} primaryColor={primaryColor} />
        <BookingModalRoot />
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </div>
    </>
  );
}
