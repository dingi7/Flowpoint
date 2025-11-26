'use client';

import {
    Dialog,
    DialogContent,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '../ui/dialog';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Barber } from '@/stores/types/booking-modal.types';
import { UserInfo } from '@/stores/types/booking-modal.types';
import { useState, useEffect } from 'react';
import { ChooseBarber } from './ChooseBarber';
import { Calendar } from './Calendar';
import { UserInfoForm } from './UserInfoForm';
import { BookingSuccess } from './BookingSuccess';
import { useBookingModalStore } from '@/stores/booking-modal-store';
import { TimeSlot } from '@/app/types/Timeslot';
import { useBookAppointment } from '@/hooks/service-hooks/availability/use-book-appointment';
import { Member, OWNER_TYPE, Service, CustomerData } from '@/core';
import { ORGANIZATION_ID } from '@/constants';
import { userInfoAnimation } from './animations';
import { useMembers, useServices, useAvailableTimeslots, useCreateCustomer } from '@/hooks';
import { useTranslation } from '@/lib/useTranslation';
import { getLocalizedMemberValue } from '@/lib/member-localization';

export interface BookingModalProps {
    isOpen: boolean;
    closeModal: () => void;
  }

export function BookingModal({ isOpen, closeModal }: BookingModalProps) {
    const { locale } = useTranslation();
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [step, setStep] = useState<
        'barber' | 'datetime' | 'userInfo' | 'success'
    >('barber');
    const [direction, setDirection] = useState(0);

    const [userInfo, setUserInfo] = useState<UserInfo>({
        name: '',
        email: '',
        phone: '',
        notes: '',
    });
    const { initialService, initialBarber } = useBookingModalStore();
    const [selectedService, setSelectedService] = useState<Service | null>(
        initialService
    );

    // Fetch services and members using hooks
    const { data: servicesData } = useServices({
        pagination: { limit: 100 },
        orderBy: { field: 'name', direction: 'asc' },
    });

    const { data: membersData } = useMembers({
        pagination: { limit: 100 },
        orderBy: { field: 'name', direction: 'asc' },
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
        ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`
        : '';


    const {
        data: timeslotsData,
        isLoading: isLoadingTimeSlots,
    } = useAvailableTimeslots({
        serviceId: selectedService?.id || '',
        date: formattedDate,
        assigneeId: selectedBarber?.id || undefined,
        enabled: !!selectedService && !!selectedDate && !!selectedBarber,
    });
    
    // Convert timeslots to the format expected by the UI
    const availableTimeSlots: TimeSlot[] = timeslotsData?.result?.map((slot) => ({
        start_time: slot.start,
        end_time: slot.end,
    })) || [];

    // Use the customer creation hook
    const createCustomerMutation = useCreateCustomer();
    
    // Use the booking hook
    const { mutate: bookAppointment, isPending: isBooking } = useBookAppointment({
        onSuccess: (data) => {
            console.log('Booking created successfully:', data);
            setDirection(1);
            setStep('success');
        },
        onError: (error) => {
            console.error('Error creating booking:', error);
            // TODO: Show error message to user
        },
    });

    // Reset selected service when initial service changes
    useEffect(() => {
        setSelectedService(initialService);
    }, [initialService]);

    // Handle initial barber selection
    useEffect(() => {
        if (initialBarber) {
            setSelectedBarber(initialBarber);
            setStep('datetime');
        }
    }, [initialBarber]);

    const handleDateSelect = async (day: number | null) => {
        if (!day || !selectedBarber) return;
        setSelectedDate(day);
        setSelectedTime(null);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
        if (selectedDate && selectedService) {
            setDirection(1);
            setStep('userInfo');
        }
    };

    const handleBarberSelect = (barber: Barber) => {
        setDirection(1);
        setSelectedBarber(barber);
        setStep('datetime');
    };

    const handleBackToDateTime = () => {
        setDirection(-1);
        setStep('datetime');
    };

    const handleBackToBarber = () => {
        setDirection(-1);
        setStep('barber');
    };

    const handleSubmit = async () => {
        if (!selectedTime || !selectedService || !selectedBarber) {
            console.error('Missing required fields');
            return;
        }

        try {
            // Step 1: Create customer first
            const customerData: CustomerData = {
                organizationId: ORGANIZATION_ID,
                name: userInfo.name,
                email: userInfo.email,
                phone: userInfo.phone || '',
                address: '',
                notes: userInfo.notes || '',
                customFields: {},
            };

            console.log('Creating customer with data:', customerData);
            const customerId = await createCustomerMutation.mutateAsync({
                data: customerData,
                organizationId: ORGANIZATION_ID,
            });

            console.log('Customer created with ID:', customerId);

            // Step 2: Create appointment
            // selectedTime is already a UTC ISO string from the timeslot
            console.log('Submitting booking with UTC time:', selectedTime);

            // Prepare the payload according to BookAppointmentPayload interface
            bookAppointment({
                serviceId: selectedService.id,
                customerEmail: userInfo.email,
                startTime: selectedTime, // Already in UTC ISO format
                assigneeId: selectedBarber.id,
                assigneeType: OWNER_TYPE.MEMBER, // Barbers are members
                fee: selectedService.price,
                title: `${selectedService.name} - ${userInfo.name}`,
                description: userInfo.notes || '',
                additionalCustomerFields: {
                    customerId: customerId,
                    name: userInfo.name,
                    phone: userInfo.phone,
                },
            });
        } catch (error) {
            console.error('Error in booking process:', error);
            // TODO: Show error message to user
        }
    };

    const handleClose = () => {
        closeModal();
        // Reset the form after a short delay to allow the closing animation
        setTimeout(() => {
            setStep(initialBarber ? 'datetime' : 'barber');
            setSelectedBarber(initialBarber || null);
            setSelectedDate(null);
            setSelectedTime(null);
            setUserInfo({
                name: '',
                email: '',
                phone: '',
                notes: '',
            });
        }, 300);
    };
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogPortal>
                <DialogOverlay className='bg-black/50' />
                <DialogContent
                    className={cn(
                        'bg-background',
                        step === 'success'
                            ? 'w-[90%] md:w-[600px] h-fit'
                            : step === 'userInfo'
                            ? 'w-[95%] md:w-[700px] h-fit'
                            : step === 'barber'
                            ? 'w-[90%] md:w-[800px]'
                            : 'md:max-w-[95vw] lg:max-w-[90vw] lg:h-fit h-[85vh] ' +
                              (selectedDate && selectedService
                                  ? 'lg:w-[90vw]'
                                  : 'lg:w-[70vw]')
                    )}
                >
                    <DialogTitle className="sr-only">
                        Book Appointment
                    </DialogTitle>
                    <AnimatePresence
                        initial={false}
                        custom={direction}
                        mode='wait'
                    >
                        {step === 'success' &&
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

                        {step === 'barber' && (
                            <ChooseBarber
                                direction={direction}
                                barbers={barbers.filter(
                                    (barber) => barber.working === true
                                )}
                                handleBarberSelect={handleBarberSelect}
                            />
                        )}

                        {step === 'userInfo' && (
                            <motion.div
                                key='userInfo'
                                variants={userInfoAnimation}
                                initial='initial'
                                animate='animate'
                                exit='exit'
                                transition={{
                                    scale: {
                                        type: 'spring',
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
                                    isSubmitting={isBooking || createCustomerMutation.isPending}
                                />
                            </motion.div>
                        )}

                        {step === 'datetime' && (
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
            </DialogPortal>
        </Dialog>
    );
}
