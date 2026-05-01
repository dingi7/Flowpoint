"use client";

import { useBookingModalStore } from "@/stores/booking-modal-store";
import { BookingModal } from "./BookingModal";

interface BookingModalRootProps {
  theme?: "default" | "light";
  showAiMirror?: boolean;
}

export function BookingModalRoot({
  theme = "default",
  showAiMirror = false,
}: BookingModalRootProps) {
  const { isOpen, closeModal } = useBookingModalStore();

  return (
    <BookingModal
      isOpen={isOpen}
      closeModal={closeModal}
      theme={theme}
      showAiMirror={showAiMirror}
    />
  );
}
