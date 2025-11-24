"use client";

import { useTranslation } from "@/lib/useTranslation";
import { FadeInView } from "../components/FadeInView";
import { MemberCard } from "../components/MemberCard";
import { useMembers } from "@/hooks/repository-hooks/member/use-member";
import { Member } from "@/core";
import { useEffect } from "react";

export default function Team() {
    const { data } = useMembers({
        pagination: { limit: 50 },
    });
    const barbers = data?.pages.flatMap(page => page.filter(member => member.status !== "hidden")).sort((a, b) => a.name.localeCompare(b.name)) || [];
    const { t } = useTranslation();

    // Preload first 3 barber images for faster initial load
    useEffect(() => {
        if (barbers.length > 0) {
            const imagesToPreload = barbers.slice(0, 3).filter(barber => barber.image);
            imagesToPreload.forEach((barber) => {
                // Use Image constructor for better browser handling
                const img = new Image();
                img.src = barber.image!;
                img.loading = 'eager';
            });
        }
    }, [barbers]);

    return (
        <section
            id='team'
            className='bg-[#0A0A0A] py-20 px-4 relative overflow-hidden'
        >
            <div className='max-w-7xl mx-auto relative z-10'>
                <FadeInView>
                    <div className='text-center mb-16'>
                        <h2 className='text-4xl md:text-5xl font-bold mb-4'>
                            <span className='text-white'>
                                {t('team.title')}
                            </span>{' '}
                            <span className='text-[#B5A48A]'>
                                MASTER
                                <br />
                                BARBERS
                            </span>
                        </h2>
                        <p className='text-gray-400 text-lg max-w-2xl mx-auto'>
                            {t('team.subtitle')}
                        </p>
                    </div>
                </FadeInView>

                <div className='flex flex-col md:flex-row flex-wrap gap-8 justify-center items-center'>
                    {barbers.map((member: Member, index: number) => (
                        <MemberCard key={member.id} member={member} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
