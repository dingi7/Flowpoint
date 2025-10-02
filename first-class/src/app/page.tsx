"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeroSection } from "./sections/HeroSection";
import { Services } from "./sections/Services";

export default function Home() {
  const queryClient = new QueryClient();
  return (
    <>
        <QueryClientProvider client={queryClient}>

      <HeroSection />
      <Services />
      </QueryClientProvider>
    </>
  );
}
