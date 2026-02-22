"use client";

import { FadeInView } from "../components/FadeInView";
import { MemberCard } from "../components/MemberCard";
import { Member } from "@/core";
import { useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/useTranslation";

export interface TeamProps {
    members: Member[];
    title?: string;
    subtitle?: string;
    primaryColor?: string;
}

export default function Team({ members, title, subtitle, primaryColor }: TeamProps) {
    const teamMembers = useMemo(() => {
        return members
            .filter((member) => member.status !== "hidden")
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [members]);
    const { t } = useTranslation();
    const resolvedTitle = title || t('team.title');
    const resolvedSubtitle = subtitle || t('team.subtitle');

    useEffect(() => {
        if (teamMembers.length > 0) {
            const imagesToPreload = teamMembers.slice(0, 3).filter(m => m.image);
            imagesToPreload.forEach((member) => {
                const img = new Image();
                img.src = member.image!;
                img.loading = 'eager';
            });
        }
    }, [teamMembers]);

    return (
        <section
            id='team'
            className='relative py-24 md:py-32 px-4 overflow-hidden'
            style={{ background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)' }}
        >
            {/* Decorative vertical line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent to-slate-300" />

            <div className='max-w-7xl mx-auto relative'>
                <FadeInView>
                    <div className='text-center mb-20'>
                        <div className="flex items-center justify-center gap-3 mb-5">
                            <div className="h-px w-8 bg-teal-400" />
                            <span className="text-teal-600 text-xs tracking-[0.2em] uppercase font-semibold">
                                {t('team.eyebrow') || 'Our Specialists'}
                            </span>
                            <div className="h-px w-8 bg-teal-400" />
                        </div>
                        <h2 className='font-["Playfair_Display",_Georgia,_serif] text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-slate-900 leading-tight'>
                            {resolvedTitle}
                        </h2>
                        <p className='text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed'>
                            {resolvedSubtitle}
                        </p>
                    </div>
                </FadeInView>

                <div className='flex flex-col md:flex-row flex-wrap gap-6 justify-center items-stretch'>
                    {teamMembers.map((member: Member, index: number) => (
                        <MemberCard key={member.id} member={member} index={index} primaryColor={primaryColor} />
                    ))}
                </div>
            </div>
        </section>
    );
}
