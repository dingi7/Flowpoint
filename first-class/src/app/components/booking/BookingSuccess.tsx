import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { Barber } from "@/stores/types/booking-modal.types";
import { Service } from "@/core";
import { useTranslation } from "@/lib/useTranslation";
import { formatTimeSlot } from "@/lib/utils";

interface BookingSuccessProps {
  selectedBarber: Barber;
  selectedService: Service;
  selectedTime: string;
  onClose: () => void;
}

export function BookingSuccess({
  selectedBarber,
  selectedService,
  selectedTime,
  onClose,
}: BookingSuccessProps) {
  const { t } = useTranslation();
  console.log("Appointment date:", selectedTime);

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="flex flex-col items-center justify-center p-4 sm:p-6 space-y-3 sm:space-y-4 text-center"
    >
      <div className="flex flex-col items-center space-y-1 sm:space-y-2">
        <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500" />
        <h2 className="text-xl sm:text-2xl font-bold">{t("booking.bookingSuccess")}</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("booking.bookingConfirmationMessage")}
        </p>
      </div>

      <div className="w-full max-w-md p-4 sm:p-6 mt-3 sm:mt-4 space-y-3 sm:space-y-4 border rounded-lg bg-muted/50">
        <div className="space-y-2">
          <h3 className="text-sm sm:text-base font-medium">{t("booking.appointmentDetails")}</h3>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-xs sm:text-sm">
            <span className="text-muted-foreground">{t("booking.date")}:</span>
            <span>{format(new Date(selectedTime), 'MMMM d, yyyy')}</span>
            

            <span className="text-muted-foreground">{t("booking.time")}:</span>
            <span>{formatTimeSlot(selectedTime)}</span>
            

            <span className="text-muted-foreground">{t("booking.service")}:</span>
            <span>{selectedService.name}</span>
            
            <span className="text-muted-foreground">{t("booking.barber")}:</span>
            <span>{selectedBarber.name}</span>
            
            <span className="text-muted-foreground">{t("booking.duration")}:</span>
            <span>{selectedService.duration} {t("booking.minutes")}</span>
          </div>
        </div>
      </div>

      <Button onClick={onClose} className="mt-6">
        {t("booking.close")}
      </Button>
    </motion.div>
  );
} 