import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useMemo } from 'react';
import {
  BookingModalStore,
  BookingStep,
  Barber,
  UserInfo,
  TimeSlot,
} from './types/booking-modal.types';
import { Service } from '@/core';

const today = new Date();

const initialState = {
  // Modal state
  isOpen: false,
  step: 'barber' as BookingStep,
  direction: 0,

  // Selection state
  selectedBarber: null,
  selectedService: null,
  selectedDate: null,
  selectedTime: null,

  // Date navigation
  currentMonth: today.getMonth(),
  currentYear: today.getFullYear(),

  // User info form
  userInfo: {
    name: '',
    email: '',
    phone: '',
    notes: '',
  },

  // Time slots
  availableTimeSlots: [],
  isLoadingTimeSlots: false,

  // Initial values
  initialBarber: null,
  initialService: null,
};

export const useBookingModalStore = create<BookingModalStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Modal actions
      openModal: () => set({ isOpen: true }, false, 'openModal'),

      closeModal: () => set({ isOpen: false }, false, 'closeModal'),

      setStep: (step: BookingStep) => set({ step }, false, 'setStep'),

      setDirection: (direction: number) =>
        set({ direction }, false, 'setDirection'),

      // Selection actions
      setSelectedBarber: (barber: Barber | null) =>
        set({ selectedBarber: barber }, false, 'setSelectedBarber'),

      setSelectedService: (service: Service | null) =>
        set({ selectedService: service }, false, 'setSelectedService'),

      setSelectedDate: (date: number | null) =>
        set(
          {
            selectedDate: date,
            selectedTime: null, // Reset time when date changes
          },
          false,
          'setSelectedDate'
        ),

      setSelectedTime: (time: string | null) =>
        set({ selectedTime: time }, false, 'setSelectedTime'),

      // Date navigation actions
      setCurrentMonth: (month: number) =>
        set({ currentMonth: month }, false, 'setCurrentMonth'),

      setCurrentYear: (year: number) =>
        set({ currentYear: year }, false, 'setCurrentYear'),

      navigateMonth: (month: number, year: number) =>
        set(
          {
            currentMonth: month,
            currentYear: year,
          },
          false,
          'navigateMonth'
        ),

      // User info actions
      setUserInfo: (userInfo: UserInfo) =>
        set({ userInfo }, false, 'setUserInfo'),

      updateUserInfo: (updates: Partial<UserInfo>) =>
        set(
          (state) => ({
            userInfo: { ...state.userInfo, ...updates },
          }),
          false,
          'updateUserInfo'
        ),

      // Time slots actions
      setAvailableTimeSlots: (slots: TimeSlot[]) =>
        set({ availableTimeSlots: slots }, false, 'setAvailableTimeSlots'),

      setIsLoadingTimeSlots: (loading: boolean) =>
        set({ isLoadingTimeSlots: loading }, false, 'setIsLoadingTimeSlots'),

      // Initial values actions
      setInitialBarber: (barber: Barber | null) =>
        set(
          {
            initialBarber: barber,
            selectedBarber: barber,
            // If initial barber is set, skip to datetime step
            step: barber ? 'datetime' : get().step,
          },
          false,
          'setInitialBarber'
        ),

      setInitialService: (service: Service | null) =>
        set(
          {
            initialService: service,
            selectedService: service,
          },
          false,
          'setInitialService'
        ),

      // Navigation helpers
      goToBarberSelection: () =>
        set(
          {
            step: 'barber',
            direction: -1,
          },
          false,
          'goToBarberSelection'
        ),

      goToDateTimeSelection: () =>
        set(
          {
            step: 'datetime',
            direction: 1,
          },
          false,
          'goToDateTimeSelection'
        ),

      goToUserInfoForm: () =>
        set(
          {
            step: 'userInfo',
            direction: 1,
          },
          false,
          'goToUserInfoForm'
        ),

      goToSuccess: () =>
        set(
          {
            step: 'success',
            direction: 1,
          },
          false,
          'goToSuccess'
        ),

      // Reset
      reset: () => set(initialState, false, 'reset'),

      softReset: () =>
        set(
          {
            step: get().initialBarber ? 'datetime' : 'barber',
            direction: 0,
            selectedBarber: get().initialBarber,
            selectedService: get().initialService,
            selectedDate: null,
            selectedTime: null,
            userInfo: {
              name: '',
              email: '',
              phone: '',
              notes: '',
            },
            availableTimeSlots: [],
            isLoadingTimeSlots: false,
          },
          false,
          'softReset'
        ),
    }),
    {
      name: 'booking-modal-store',
    }
  )
);

// Selector hooks for better performance
export const useBookingModalOpen = () =>
  useBookingModalStore((state) => state.isOpen);

export const useBookingStep = () =>
  useBookingModalStore((state) => state.step);

export const useBookingDirection = () =>
  useBookingModalStore((state) => state.direction);

export const useSelectedBarber = () =>
  useBookingModalStore((state) => state.selectedBarber);

export const useSelectedService = () =>
  useBookingModalStore((state) => state.selectedService);

export const useSelectedDate = () =>
  useBookingModalStore((state) => state.selectedDate);

export const useSelectedTime = () =>
  useBookingModalStore((state) => state.selectedTime);

export const useCurrentMonth = () =>
  useBookingModalStore((state) => state.currentMonth);

export const useCurrentYear = () =>
  useBookingModalStore((state) => state.currentYear);

export const useUserInfo = () =>
  useBookingModalStore((state) => state.userInfo);

export const useAvailableTimeSlots = () =>
  useBookingModalStore((state) => state.availableTimeSlots);

export const useIsLoadingTimeSlots = () =>
  useBookingModalStore((state) => state.isLoadingTimeSlots);

export const useInitialBarber = () =>
  useBookingModalStore((state) => state.initialBarber);

export const useInitialService = () =>
  useBookingModalStore((state) => state.initialService);

// Action hooks
export const useBookingModalActions = () => {
  const openModal = useBookingModalStore((state) => state.openModal);
  const closeModal = useBookingModalStore((state) => state.closeModal);
  const setStep = useBookingModalStore((state) => state.setStep);
  const setDirection = useBookingModalStore((state) => state.setDirection);
  const setSelectedBarber = useBookingModalStore(
    (state) => state.setSelectedBarber
  );
  const setSelectedService = useBookingModalStore(
    (state) => state.setSelectedService
  );
  const setSelectedDate = useBookingModalStore(
    (state) => state.setSelectedDate
  );
  const setSelectedTime = useBookingModalStore(
    (state) => state.setSelectedTime
  );
  const setCurrentMonth = useBookingModalStore(
    (state) => state.setCurrentMonth
  );
  const setCurrentYear = useBookingModalStore(
    (state) => state.setCurrentYear
  );
  const navigateMonth = useBookingModalStore((state) => state.navigateMonth);
  const setUserInfo = useBookingModalStore((state) => state.setUserInfo);
  const updateUserInfo = useBookingModalStore((state) => state.updateUserInfo);
  const setAvailableTimeSlots = useBookingModalStore(
    (state) => state.setAvailableTimeSlots
  );
  const setIsLoadingTimeSlots = useBookingModalStore(
    (state) => state.setIsLoadingTimeSlots
  );
  const setInitialBarber = useBookingModalStore(
    (state) => state.setInitialBarber
  );
  const setInitialService = useBookingModalStore(
    (state) => state.setInitialService
  );
  const goToBarberSelection = useBookingModalStore(
    (state) => state.goToBarberSelection
  );
  const goToDateTimeSelection = useBookingModalStore(
    (state) => state.goToDateTimeSelection
  );
  const goToUserInfoForm = useBookingModalStore(
    (state) => state.goToUserInfoForm
  );
  const goToSuccess = useBookingModalStore((state) => state.goToSuccess);
  const reset = useBookingModalStore((state) => state.reset);
  const softReset = useBookingModalStore((state) => state.softReset);

  return useMemo(
    () => ({
      openModal,
      closeModal,
      setStep,
      setDirection,
      setSelectedBarber,
      setSelectedService,
      setSelectedDate,
      setSelectedTime,
      setCurrentMonth,
      setCurrentYear,
      navigateMonth,
      setUserInfo,
      updateUserInfo,
      setAvailableTimeSlots,
      setIsLoadingTimeSlots,
      setInitialBarber,
      setInitialService,
      goToBarberSelection,
      goToDateTimeSelection,
      goToUserInfoForm,
      goToSuccess,
      reset,
      softReset,
    }),
    [
      openModal,
      closeModal,
      setStep,
      setDirection,
      setSelectedBarber,
      setSelectedService,
      setSelectedDate,
      setSelectedTime,
      setCurrentMonth,
      setCurrentYear,
      navigateMonth,
      setUserInfo,
      updateUserInfo,
      setAvailableTimeSlots,
      setIsLoadingTimeSlots,
      setInitialBarber,
      setInitialService,
      goToBarberSelection,
      goToDateTimeSelection,
      goToUserInfoForm,
      goToSuccess,
      reset,
      softReset,
    ]
  );
};

// Computed selector hooks
export const useBookingSelection = () => {
  const selectedBarber = useSelectedBarber();
  const selectedService = useSelectedService();
  const selectedDate = useSelectedDate();
  const selectedTime = useSelectedTime();

  return useMemo(
    () => ({
      selectedBarber,
      selectedService,
      selectedDate,
      selectedTime,
      isComplete:
        !!selectedBarber &&
        !!selectedService &&
        selectedDate !== null &&
        !!selectedTime,
    }),
    [selectedBarber, selectedService, selectedDate, selectedTime]
  );
};

export const useBookingDateTime = () => {
  const currentMonth = useCurrentMonth();
  const currentYear = useCurrentYear();
  const selectedDate = useSelectedDate();

  return useMemo(
    () => ({
      currentMonth,
      currentYear,
      selectedDate,
    }),
    [currentMonth, currentYear, selectedDate]
  );
};

