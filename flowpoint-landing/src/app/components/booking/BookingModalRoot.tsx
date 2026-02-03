"use client";

import { useBookingModalStore } from "@/stores/booking-modal-store";
import { BookingModal } from "./BookingModal";

export function BookingModalRoot() {
  const { isOpen, closeModal } = useBookingModalStore();

  return <BookingModal isOpen={isOpen} closeModal={closeModal} />;
}
