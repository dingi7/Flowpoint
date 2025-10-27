import { Service } from '@/core';

export interface Barber {
  id: string;
  name: string;
  image?: string;
  description?: string;
  working?: boolean;
}

export interface UserInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface TimeSlot {
  start_time: string;
  end_time?: string;
}

export type BookingStep = 'barber' | 'datetime' | 'userInfo' | 'success';

export interface BookingModalState {
  // Modal state
  isOpen: boolean;
  step: BookingStep;
  direction: number;

  // Selection state
  selectedBarber: Barber | null;
  selectedService: Service | null;
  selectedDate: number | null;
  selectedTime: string | null;

  // Date navigation
  currentMonth: number;
  currentYear: number;

  // User info form
  userInfo: UserInfo;

  // Time slots
  availableTimeSlots: TimeSlot[];
  isLoadingTimeSlots: boolean;

  // Initial values (from external triggers)
  initialBarber: Barber | null;
  initialService: Service | null;
}

export interface BookingModalActions {
  // Modal actions
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: BookingStep) => void;
  setDirection: (direction: number) => void;
  
  // Selection actions
  setSelectedBarber: (barber: Barber | null) => void;
  setSelectedService: (service: Service | null) => void;
  setSelectedDate: (date: number | null) => void;
  setSelectedTime: (time: string | null) => void;

  // Date navigation actions
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  navigateMonth: (month: number, year: number) => void;

  // User info actions
  setUserInfo: (userInfo: UserInfo) => void;
  updateUserInfo: (updates: Partial<UserInfo>) => void;

  // Time slots actions
  setAvailableTimeSlots: (slots: TimeSlot[]) => void;
  setIsLoadingTimeSlots: (loading: boolean) => void;

  // Initial values actions
  setInitialBarber: (barber: Barber | null) => void;
  setInitialService: (service: Service | null) => void;

  // Navigation helpers
  goToBarberSelection: () => void;
  goToDateTimeSelection: () => void;
  goToUserInfoForm: () => void;
  goToSuccess: () => void;

  // Reset
  reset: () => void;
  softReset: () => void; // Reset without closing modal
}

export type BookingModalStore = BookingModalState & BookingModalActions;

