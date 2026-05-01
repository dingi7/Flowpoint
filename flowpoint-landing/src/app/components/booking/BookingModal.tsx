"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Barber,
  BookingStep,
  UserInfo,
} from "@/stores/types/booking-modal.types";
import { CSSProperties, useState, useEffect } from "react";
import { AiMirrorStep } from "./AiMirrorStep";
import { ChooseBarber } from "./ChooseBarber";
import { Calendar } from "./Calendar";
import { UserInfoForm } from "./UserInfoForm";
import { BookingSuccess } from "./BookingSuccess";
import { useBookingModalStore } from "@/stores/booking-modal-store";
import { TimeSlot } from "@/app/types/Timeslot";
import { useBookAppointment } from "@/hooks/service-hooks/availability/use-book-appointment";
import {
  CustomerData,
  HairstyleRecommendation,
  Member,
  Service,
} from "@/core";
import { userInfoAnimation } from "./animations";
import {
  useMembers,
  useServices,
  useAvailableTimeslots,
  useCreateCustomer,
  useCustomerByEmail,
} from "@/hooks";
import { useTranslation } from "@/lib/useTranslation";
import { getLocalizedMemberValue } from "@/lib/member-localization";
import { useTenant } from "@/app/context/TenantContext";

export interface BookingModalProps {
  isOpen: boolean;
  closeModal: () => void;
  theme?: "default" | "light";
  showAiMirror?: boolean;
}

const lightThemeVariables: CSSProperties = {
  ["--background" as string]: "oklch(1 0 0)",
  ["--foreground" as string]: "oklch(0.145 0 0)",
  ["--card" as string]: "oklch(1 0 0)",
  ["--card-foreground" as string]: "oklch(0.145 0 0)",
  ["--popover" as string]: "oklch(1 0 0)",
  ["--popover-foreground" as string]: "oklch(0.145 0 0)",
  ["--primary" as string]: "oklch(0.205 0 0)",
  ["--primary-foreground" as string]: "oklch(0.985 0 0)",
  ["--secondary" as string]: "oklch(0.97 0 0)",
  ["--secondary-foreground" as string]: "oklch(0.205 0 0)",
  ["--muted" as string]: "oklch(0.97 0 0)",
  ["--muted-foreground" as string]: "oklch(0.556 0 0)",
  ["--accent" as string]: "oklch(0.97 0 0)",
  ["--accent-foreground" as string]: "oklch(0.205 0 0)",
  ["--destructive" as string]: "oklch(0.577 0.245 27.325)",
  ["--border" as string]: "oklch(0.922 0 0)",
  ["--input" as string]: "oklch(0.922 0 0)",
  ["--ring" as string]: "oklch(0.708 0 0)",
};

export function BookingModal({
  isOpen,
  closeModal,
  theme = "default",
  showAiMirror = false,
}: BookingModalProps) {
  const { locale } = useTranslation();
  const { organizationId } = useTenant();
  const {
    initialService,
    initialBarber,
    setInitialService,
    setInitialBarber,
  } = useBookingModalStore();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [step, setStep] = useState<BookingStep>("barber");
  const [direction, setDirection] = useState(0);
  const [isFormProcessing, setIsFormProcessing] = useState(false);

  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [selectedService, setSelectedService] = useState<Service | null>(
    initialService
  );

  // Fetch services and members using hooks
  const { data: servicesData } = useServices({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  const { data: membersData } = useMembers({
    pagination: { limit: 100 },
    orderBy: { field: "name", direction: "asc" },
  });

  // Flatten the data
  const services = servicesData?.pages?.flatMap((page) => page) || [];
  const members = membersData?.pages?.flatMap((page) => page) || [];

  // Convert members to barbers format for the UI with localized name and description
  const barbers: Barber[] = members.map((member: Member) => ({
    id: member.id,
    name: getLocalizedMemberValue(member, "name", locale),
    image: member.image,
    description: getLocalizedMemberValue(member, "description", locale),
    working: member.status === "active", // Assume all fetched members are working
  }));

  // Fetch available timeslots when date and service are selected
  const formattedDate = selectedDate
    ? `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
      selectedDate
    ).padStart(2, "0")}`
    : "";

  const { data: timeslotsData, isLoading: isLoadingTimeSlots } =
    useAvailableTimeslots({
      serviceId: selectedService?.id || "",
      date: formattedDate,
      assigneeId: selectedBarber?.id || "",
      enabled: !!selectedService && !!selectedDate && !!selectedBarber,
    });

  // Convert timeslots to the format expected by the UI
  const availableTimeSlots: TimeSlot[] =
    timeslotsData?.result?.map((slot) => ({
      start_time: slot.start,
      end_time: slot.end,
    })) || [];

  // Use the customer creation hook
  const createCustomerMutation = useCreateCustomer();

  // Use the customer lookup hook at the top level
  const { refetch: refetchCustomer } = useCustomerByEmail(
    userInfo.email
  );

  // Use the booking hook
  const { mutate: bookAppointment, isPending: isBooking } = useBookAppointment({
    onSuccess: (data) => {
      console.log("Booking created successfully:", data);
      setIsFormProcessing(false);
      setDirection(1);
      setStep("success");
    },
    onError: (error) => {
      console.error("Error creating booking:", error);
      setIsFormProcessing(false);
      // TODO: Show error message to user
    },
  });

  // Reset selected service when initial service changes
  useEffect(() => {
    setSelectedService(initialService);
  }, [initialService]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialBarber) {
      setSelectedBarber(initialBarber);
      setStep("datetime");
      return;
    }

    if (initialService) {
      setStep("barber");
      return;
    }

    setStep("barber");
  }, [initialBarber, initialService, isOpen, showAiMirror]);

  const handleDateSelect = async (day: number | null) => {
    if (!day || !selectedBarber) return;
    setSelectedDate(day);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate && selectedService) {
      setDirection(1);
      setStep(showAiMirror ? "aiMirror" : "userInfo");
    }
  };

  const handleBarberSelect = (barber: Barber) => {
    setDirection(1);
    setSelectedBarber(barber);
    setStep("datetime");
  };

  const handleAiMirrorSkip = () => {
    setDirection(1);
    setStep("userInfo");
  };

  const handleRecommendationSelect = (recommendation: HairstyleRecommendation) => {
    const service = recommendation.matchedServiceId
      ? services.find(
        (currentService) => currentService.id === recommendation.matchedServiceId,
      )
      : null;

    if (service) {
      setSelectedService(service);
    }

    setDirection(1);
    setStep("userInfo");
  };

  const handleBackToDateTime = () => {
    setDirection(-1);
    setStep(showAiMirror ? "aiMirror" : "datetime");
  };

  const handleBackFromAiMirror = () => {
    setDirection(-1);
    setStep("datetime");
  };

  const handleBackToBarber = () => {
    setDirection(-1);
    setStep("barber");
  };

  const handleSubmit = async () => {
    if (!selectedTime || !selectedService || !selectedBarber || !organizationId) {
      console.error("Missing required fields");
      return;
    }

    setIsFormProcessing(true);

    try {
      let customerId = "";

      // Refetch customer to ensure we have the latest data
      const { data: customer } = await refetchCustomer();

      if (customer && customer.length > 0) {
        customerId = customer[0].id;
        console.log("Customer already exists with ID:", customerId);
      } else {
        // Step 1: Create customer first
        const customerData: CustomerData = {
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone || "",
          address: "",
          notes: userInfo.notes || "",
          customFields: {},
        };

        console.log("Creating customer with data:", customerData);
        customerId = await createCustomerMutation.mutateAsync({
          data: customerData,
          organizationId,
        });
        console.log("Customer created with ID:", customerId);
      }

      // Step 2: Create appointment
      // selectedTime is already a UTC ISO string from the timeslot
      console.log("Submitting booking with UTC time:", selectedTime);

      // Prepare the payload according to BookAppointmentPayload interface
      bookAppointment({
        serviceId: selectedService.id,
        customerEmail: userInfo.email,
        startTime: selectedTime, // Already in UTC ISO format
        assigneeId: selectedBarber.id,
        customerData: {
          name: userInfo.name,
          phone: userInfo.phone,
          address: "",
          notes: userInfo.notes || "",
        },
        fee: selectedService.price,
        title: `${selectedService.name} - ${userInfo.name}`,
        description: userInfo.notes || "",
      });
    } catch (error) {
      console.error("Error in booking process:", error);
      setIsFormProcessing(false);
      // TODO: Show error message to user
    }
  };

  const handleClose = () => {
    closeModal();
    // Reset the form after a short delay to allow the closing animation
    setTimeout(() => {
      setStep(initialBarber ? "datetime" : "barber");
      setSelectedBarber(initialBarber || null);
      setSelectedDate(null);
      setSelectedTime(null);
      setUserInfo({
        name: "",
        email: "",
        phone: "",
        notes: "",
      });
      setInitialService(null);
      setInitialBarber(null);
    }, 300);
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        overlayClassName={theme === "light" ? "bg-white/60 backdrop-blur-sm" : "bg-black/50"}
        className={cn(
          "bg-background text-foreground",
          step === "success"
            ? "w-[90%] max-w-[600px] h-fit"
            : step === "aiMirror"
              ? "h-[90vh] w-[95%] max-w-5xl overflow-hidden lg:h-[85vh]"
            : step === "userInfo"
              ? "w-[95%] max-w-[700px] h-fit"
              : step === "barber"
                ? "w-[90%] max-w-[900px]"
                : "md:max-w-[95vw] lg:max-w-[90vw] lg:h-fit h-[85vh] " +
                (selectedDate && selectedService
                  ? "lg:w-[90vw]"
                  : "lg:w-[70vw]")
        )}
        style={theme === "light" ? lightThemeVariables : undefined}
      >
        <DialogTitle className="sr-only">Book Appointment</DialogTitle>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {step === "success" &&
            selectedTime &&
            selectedService &&
            selectedBarber && (
              <BookingSuccess
                selectedBarber={selectedBarber}
                selectedService={selectedService}
                selectedTime={selectedTime}
                onClose={handleClose}
              />
            )}

          {step === "aiMirror" && (
            <AiMirrorStep
              direction={direction}
              services={services}
              onSkip={handleAiMirrorSkip}
              onBack={handleBackFromAiMirror}
              onRecommendationSelect={handleRecommendationSelect}
            />
          )}

          {step === "barber" && (
            <ChooseBarber
              direction={direction}
              barbers={barbers.filter((barber) => barber.working === true)}
              handleBarberSelect={handleBarberSelect}
            />
          )}

          {step === "userInfo" && (
            <motion.div
              key="userInfo"
              variants={userInfoAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                scale: {
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                },
                opacity: { duration: 0.2 },
              }}
            >
              <UserInfoForm
                selectedBarber={selectedBarber}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                currentMonth={currentMonth}
                currentYear={currentYear}
                userInfo={userInfo}
                onUserInfoChange={setUserInfo}
                onSubmit={handleSubmit}
                onBack={handleBackToDateTime}
                isSubmitting={isFormProcessing || isBooking || createCustomerMutation.isPending}
              />
            </motion.div>
          )}

          {step === "datetime" && (
            <Calendar
              selectedBarber={selectedBarber}
              selectedService={selectedService}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              currentMonth={currentMonth}
              currentYear={currentYear}
              direction={direction}
              isLoadingTimeSlots={isLoadingTimeSlots}
              availableTimeSlots={availableTimeSlots}
              services={services}
              handleDateSelect={handleDateSelect}
              handleTimeSelect={handleTimeSelect}
              handleBackToBarber={handleBackToBarber}
              setSelectedService={setSelectedService}
              onNavigateMonth={(newMonth, newYear) => {
                setCurrentMonth(newMonth);
                setCurrentYear(newYear);
              }}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
