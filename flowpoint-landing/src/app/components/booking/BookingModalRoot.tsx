"use client";

import { useBookingModalStore } from "@/stores/booking-modal-store";
import { BookingModal } from "./BookingModal";

interface BookingModalRootProps {
  theme?: "default" | "light";
}

export function BookingModalRoot({ theme = "default" }: BookingModalRootProps) {
  const { isOpen, closeModal } = useBookingModalStore();

  return <BookingModal isOpen={isOpen} closeModal={closeModal} theme={theme} />;
}
