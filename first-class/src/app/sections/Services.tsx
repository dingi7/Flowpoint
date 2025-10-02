'use client';

import { Scissors, Clock } from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from '@/lib/useTranslation';
// import { useBookingModal } from '@/app/context/BookingModalContext';
import { Button } from '@/app/components/ui/button';
import { Service } from '@/core';
import { useServices } from '@/hooks/repository-hooks/service/use-service';
import { FadeInView } from '../components/FadeInView';

export function Services() {
    // use the useServices hook
    const { data: services } = useServices({
        pagination: { limit: 50 },
    });

    const allServices = services?.pages?.flatMap((page) => page) || [];
    const { t } = useTranslation();
    // const { openModal } = useBookingModal();

    const handleBookNow = (serviceId: string) => {
        const service = allServices.find((s) => s.id === serviceId);
        if (service) {
            // openModal(service);
        }
    };

    return (
        <section
            id='services'
            className='bg-[#1C1C1C] py-16 px-4 md:py-24 relative overflow-hidden'
        >
            <div className='max-w-7xl mx-auto relative z-10'>
                <FadeInView>
                    <div className='text-center mb-16'>
                        <h2 className='text-4xl md:text-5xl font-bold mb-6'>
                            <span className='text-white'>
                                {t('services.title')}
                            </span>{' '}
                            <span className='text-[#B5A48A]'>
                                BEYOND
                                <br />
                                EXPECTATION
                            </span>
                        </h2>
                    </div>
                </FadeInView>

                <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
                    {allServices.map((service: Service, index: number) => (
                        <FadeInView key={service.id} delay={index * 0.2}>
                            <div className='bg-[#242424] flex flex-col h-full group hover:bg-[#2A2A2A] transition-colors duration-300'>
                                <div className='relative w-full aspect-square overflow-hidden'>
                                    <Image
                                        src={
                                            service.image || '/placeholder.svg'
                                        }
                                        alt={service.name}
                                        fill
                                        className='object-cover transition-transform duration-500 group-hover:scale-110'
                                        sizes='(max-width: 768px) 100vw, 33vw'
                                    />

                                    <div className='absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300' />
                                </div>
                                <div className='p-8 flex flex-col flex-grow'>
                                    <div className='mb-2 relative'>
                                        <div className='absolute -top-12 left-1/2 -translate-x-1/2 bg-[#242424] p-4 rounded-full group-hover:bg-[#2A2A2A] transition-colors duration-300'>
                                            <Scissors className='w-12 h-12 text-[#98B8A0]' />
                                        </div>
                                    </div>
                                    <div className='flex flex-col flex-grow text-center'>
                                        <h3 className='text-white text-xl font-bold mb-4 mt-4'>
                                            {service.name}
                                        </h3>
                                        <p className='text-gray-400 mb-6 flex-grow'>
                                            {t(
                                                `services.${service.name}.description`
                                            )}
                                        </p>
                                    </div>
                                    <div className='flex flex-col mt-auto'>
                                        <div className='flex items-center justify-center text-[#B5A48A] mb-6'>
                                            <Clock className='w-4 h-4 mr-2' />
                                            <span>
                                                {service.duration}{' '}
                                                {t('booking.minutes')}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() =>
                                                handleBookNow(service.id)
                                            }
                                            className='w-full bg-[#B5A48A] text-[#1C1C1C] py-3 font-semibold hover:bg-[#C8B79D] transition-colors duration-300 rounded-none'
                                        >
                                            {t('services.bookNow')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </FadeInView>
                    ))}
                </div>
            </div>
        </section>
    );
}
