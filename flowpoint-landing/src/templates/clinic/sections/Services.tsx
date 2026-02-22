'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useBookingModalStore } from '@/stores/booking-modal-store';
import { Service } from '@/core';
import { FadeInView } from '../components/FadeInView';
import { useLocale } from '@/app/context/LocaleContext';
import { useCallback, useMemo } from "react";

export interface ServicesProps {
    services: Service[];
    title?: string;
    primaryColor?: string;
}

const SERVICE_ICONS: Record<number, JSX.Element> = {
    0: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    ),
    1: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
    ),
    2: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    3: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
    ),
    4: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.1 3.04.96-5.57L3.24 8.8l5.6-.82L11.42 3l2.58 4.98 5.6.82-4.04 3.84.96 5.57z" />
        </svg>
    ),
};

function getServiceIcon(index: number): JSX.Element {
    return SERVICE_ICONS[index % Object.keys(SERVICE_ICONS).length] || SERVICE_ICONS[0];
}

export function Services({ services, title, primaryColor = "#0f766e" }: ServicesProps) {
    const { locale } = useLocale();
    const allServices = useMemo(() => services || [], [services]);
    const getServiceName = useCallback((service: Service) => {
        if (service.localisation?.name[locale]) {
            return service.localisation.name[locale];
        }
        return service.name;
    }, [locale]);
    const sortedServices = useMemo(
        () =>
            [...allServices].sort((a: Service, b: Service) => {
                const orderA = a.order || 0;
                const orderB = b.order || 0;
                if (orderA !== orderB) return orderA - orderB;
                return getServiceName(a).localeCompare(getServiceName(b));
            }),
        [allServices, getServiceName],
    );
    const { t } = useTranslation();
    const { openModal, setInitialService } = useBookingModalStore();
    const resolvedTitle = title || t('services.title');

    const handleBookNow = (serviceId: string) => {
        const service = allServices.find((s) => s.id === serviceId);
        if (service) {
            setInitialService(service);
            openModal();
        }
    };

    const getServiceDescription = (service: Service) => {
        if (service.localisation?.description[locale]) {
            return service.localisation.description[locale];
        }
        return service.description || '';
    };

    return (
        <section
            id='services'
            className='relative py-24 md:py-32 px-4 bg-white overflow-hidden'
        >
            <div className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-teal-200" />

            <div className='max-w-7xl mx-auto relative'>
                <FadeInView>
                    <div className='text-center mb-20'>
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <div className="h-px w-8" style={{ background: primaryColor }} />
                            <span className="text-xs tracking-[0.2em] uppercase font-semibold"
                                style={{ color: primaryColor }}>
                                {t('services.eyebrow') || 'What We Offer'}
                            </span>
                            <div className="h-px w-8" style={{ background: primaryColor }} />
                        </div>
                        <h2 className='font-["Playfair_Display",_Georgia,_serif] text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight'>
                            {resolvedTitle}
                        </h2>
                    </div>
                </FadeInView>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {sortedServices.map((service: Service, index: number) => (
                        <FadeInView key={service.id} delay={index * 0.08}>
                            <button
                                onClick={() => handleBookNow(service.id)}
                                className='group relative bg-white border border-slate-100 rounded-2xl p-7 flex flex-col h-full text-left hover:border-slate-200 hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 w-full'
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 text-white transition-transform duration-300 group-hover:scale-110"
                                    style={{ background: primaryColor }}
                                >
                                    {getServiceIcon(index)}
                                </div>

                                <h3 className='text-slate-900 text-lg font-bold mb-2 leading-snug'>
                                    {getServiceName(service)}
                                </h3>
                                <p className='text-slate-500 text-sm leading-relaxed flex-grow mb-5'>
                                    {getServiceDescription(service)}
                                </p>

                                <div className="flex items-center gap-2 text-sm font-semibold transition-colors duration-300"
                                    style={{ color: primaryColor }}>
                                    <span>{t('services.bookNow')}</span>
                                    <ArrowRight className='w-4 h-4 transition-transform duration-300 group-hover:translate-x-1' />
                                </div>
                            </button>
                        </FadeInView>
                    ))}
                </div>
            </div>
        </section>
    );
}
