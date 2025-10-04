"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeroSection } from "./sections/HeroSection";
import { Services } from "./sections/Services";
import Team from "./sections/Team";
import { Testimonials } from "./sections/Testimonials";
import Location from "./sections/Location";

export default function Home() {
  const queryClient = new QueryClient();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <HeroSection />
        <Services />
        <Team />
        <Testimonials />
        <Location />
      </QueryClientProvider>
    </>
  );
}
