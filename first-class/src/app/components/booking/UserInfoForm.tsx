'use client';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { Barber } from '@/stores/types/booking-modal.types';
import { UserInfo } from '@/stores/types/booking-modal.types';
import { formatTimeSlot } from '@/lib/utils';
import { useTranslation } from '@/lib/useTranslation';
import { useState } from 'react';

// Constants
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

interface UserInfoFormProps {
    selectedBarber: Barber | null;
    selectedDate: number | null;
    selectedTime: string | null;
    currentMonth: number;
    currentYear: number;
    userInfo: UserInfo;
    onUserInfoChange: (info: UserInfo) => void;
    onSubmit: () => void;
    onBack: () => void;
    isSubmitting?: boolean;
}

export function UserInfoForm({
    selectedBarber,
    selectedDate,
    selectedTime,
    currentMonth,
    currentYear,
    userInfo,
    onUserInfoChange,
    onSubmit,
    onBack,
    isSubmitting = false,
}: UserInfoFormProps) {
    const { t } = useTranslation();
    const [phoneError, setPhoneError] = useState<string>('');

    const validatePhone = (phone: string) => {
        const phoneRegex = /^(\+359|0)[0-9]{9}$/;
        if (!phoneRegex.test(phone)) {
            setPhoneError(t('booking.phoneError'));
            return false;
        }
        setPhoneError('');
        return true;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPhone = e.target.value;
        onUserInfoChange({
            ...userInfo,
            phone: newPhone,
        });
        if (newPhone) {
            validatePhone(newPhone);
        } else {
            setPhoneError('');
        }
    };

    const handleSubmitWithValidation = () => {
        if (validatePhone(userInfo.phone)) {
            onSubmit();
        }
    };

    return (
        <div className='p-4 md:p-6'>
            <div className='max-w-2xl mx-auto space-y-4 md:space-y-6'>
                <div className='space-y-1 md:space-y-2'>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={onBack}
                            className='h-8 w-8'
                        >
                            <ChevronLeft className='h-4 w-4' />
                        </Button>
                        <h2 className='text-xl font-semibold'>
                            {t('booking.userInfo')}
                        </h2>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                        {t('booking.userInfoDescription')}
                    </p>
                </div>

                {selectedBarber && (
                    <div className='border rounded-lg p-3 md:p-4 space-y-1 md:space-y-2 bg-muted/50'>
                        <div className='flex items-center gap-2 md:gap-3'>
                            <Image
                                src={selectedBarber.image || '/placeholder.svg'}
                                alt={selectedBarber.name}
                                className='w-10 h-10 md:w-12 md:h-12 rounded-full object-cover'
                                width={60}
                                height={60}
                            />
                            <div>
                                <h3 className='font-medium'>
                                    {selectedBarber.name}
                                </h3>
                                {selectedDate && selectedTime && (
                                    <p className='text-sm text-muted-foreground mt-1'>
                                        {`${
                                            months[currentMonth]
                                        } ${selectedDate}, ${currentYear} at ${formatTimeSlot(
                                            selectedTime
                                        )}`}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className='space-y-3 md:space-y-4'>
                    <div className='grid gap-3 sm:grid-cols-2 sm:gap-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='name'>{t('booking.name')}</Label>
                            <Input
                                id='name'
                                value={userInfo.name}
                                onChange={(e) =>
                                    onUserInfoChange({
                                        ...userInfo,
                                        name: e.target.value,
                                    })
                                }
                                placeholder={t('booking.namePlaceholder')}
                                required
                                className='h-9 md:h-10'
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='phone'>{t('booking.phone')}</Label>
                            <Input
                                id='phone'
                                type='tel'
                                value={userInfo.phone}
                                onChange={handlePhoneChange}
                                placeholder={t('booking.phonePlaceholder')}
                                required
                                className={`h-9 md:h-10 ${phoneError ? 'border-red-500' : ''}`}
                            />
                            {phoneError && (
                                <p className='text-sm text-red-500'>{phoneError}</p>
                            )}
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='email'>{t('booking.email')}</Label>
                        <Input
                            id='email'
                            type='email'
                            value={userInfo.email}
                            onChange={(e) =>
                                onUserInfoChange({
                                    ...userInfo,
                                    email: e.target.value,
                                })
                            }
                            placeholder={t('booking.emailPlaceholder')}
                            required
                            className='h-9 md:h-10'
                        />
                    </div>

                    <div className='space-y-2'>
                        <Label htmlFor='notes'>{t('booking.notes')}</Label>
                        <Textarea
                            id='notes'
                            value={userInfo.notes}
                            onChange={(e) =>
                                onUserInfoChange({
                                    ...userInfo,
                                    notes: e.target.value,
                                })
                            }
                            placeholder={t('booking.notesPlaceholder')}
                            className='h-16 md:h-24 resize-none'
                        />
                    </div>
                </div>

                <Button
                    className='w-full'
                    onClick={handleSubmitWithValidation}
                    disabled={
                        !userInfo.name || !userInfo.email || !userInfo.phone || Boolean(phoneError) || isSubmitting
                    }
                >
                    {isSubmitting ? t('booking.submitting') || 'Submitting...' : t('booking.confirm')}
                </Button>
            </div>
        </div>
    );
}
