"use client";

import { HeroSection } from "./sections/HeroSection";
import { Services } from "./sections/Services";
import Team from "./sections/Team";
import { Testimonials } from "./sections/Testimonials";
import Location from "./sections/Location";
import { BookingModal } from "./components/booking/BookingModal";
import { useBookingModalStore } from "@/stores/booking-modal-store";

export default function Home() {
  const { isOpen, closeModal } = useBookingModalStore();
  
  return (
    <>
      <HeroSection />
      <Services />
      <Team />
      <Testimonials />
      <Location />
      <BookingModal isOpen={isOpen} closeModal={closeModal} />
    </>
  );
}
