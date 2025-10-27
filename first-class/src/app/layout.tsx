import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import Script from "next/script";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "First Class Barbershop Varna | Premium Men's Haircuts & Grooming",
  description:
    "First Class Barbershop in Varna offers premium men's haircuts, beard trims, and expert shaves at our Grand Mall location. Book your appointment online today for the best barbershop experience in Varna.",
  keywords:
    "firstclassbarbershop, barbershop varna, first class barber, first class barbershop varna, men's haircut varna, beard trim varna, grand mall barbershop, premium barbershop varna",
  metadataBase: new URL("https://firstclassbarber.shop"),
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      bg: "/bg",
      tr: "/tr",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "First Class Barbershop Varna | Premium Men's Haircuts & Grooming",
    description:
      "First Class Barbershop in Varna offers premium men's haircuts, beard trims, and expert shaves at our Grand Mall location.",
    url: "https://firstclassbarber.shop",
    siteName: "First Class Barbershop Varna",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/barbers/team.webp",
        width: 1200,
        height: 630,
        alt: "First Class Barbershop Team in Grand Mall, Varna",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "First Class Barbershop Varna | Premium Men's Haircuts & Grooming",
    description:
      "First Class Barbershop in Varna offers premium men's haircuts, beard trims, and expert shaves at our Grand Mall location.",
    images: ["/barbers/team.webp"],
  },
  authors: [{ name: "First Class Barbershop Varna" }],
  creator: "First Class Barbershop",
  publisher: "First Class Barbershop Varna",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  other: {
    "geo.region": "BG-03",
    "geo.placename": "Varna",
    "geo.position": "43.2141;27.9147",
    ICBM: "43.2141, 27.9147",
    designer: "ElevateX",
    developer: "ElevateX",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          rel="alternate"
          hrefLang="en"
          href="https://firstclassbarber.shop/"
        />
      </head>
      <body
        className={`${inter.className} bg-black text-gray-300 min-h-screen flex flex-col`}
        itemScope
        itemType="https://schema.org/BarberShop"
        suppressHydrationWarning
      >
        <span itemProp="name" className="hidden">
          First Class Barbershop Varna
        </span>
        <div
          itemProp="address"
          itemScope
          itemType="https://schema.org/PostalAddress"
          className="hidden"
        >
          <span itemProp="streetAddress">Grand Mall Varna</span>
          <span itemProp="addressLocality">Varna</span>
          <span itemProp="addressCountry">Bulgaria</span>
        </div>
          <Providers>
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </Providers>

        {/* Hidden content for SEO */}
        <div className="hidden">
          <h1>First Class Barbershop Varna - Premium Men&apos;s Grooming</h1>
          <p>
            The best barbershop in Varna located at Grand Mall. Visit First
            Class Barbershop for expert haircuts, beard trims, and shaves.
          </p>
          <p>
            Firstclassbarbershop offers professional barber services in Varna
            with experienced barbers and modern techniques.
          </p>
          <p>Website developed by ElevateX</p>
        </div>

        {/* Structured data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BarberShop",
              name: "First Class Barbershop Varna",
              image: "https://firstclassbarber.shop/barbers/team.webp",
              url: "https://firstclassbarber.shop",
              telephone: "+359888980127", // Replace with actual phone
              address: {
                "@type": "PostalAddress",
                streetAddress: "Grand Mall",
                addressLocality: "Varna",
                addressRegion: "Varna",
                postalCode: "9000", // Replace if needed
                addressCountry: "BG",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: 43.2141,
                longitude: 27.9147,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Sunday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ],
                  opens: "10:00",
                  closes: "20:00",
                },
              ],
              priceRange: "$$",
              sameAs: [
                // 'https://www.facebook.com/firstclassbarbershopvarna', // Replace with actual URLs
                "https://www.instagram.com/firstclassbarber.shop",
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
