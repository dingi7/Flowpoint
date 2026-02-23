'use client';

import React from "react";
import { Facebook, Instagram, MapPin, Music2, Phone, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/useTranslation";
import { LandingPageSettings, Organization } from "@/core";

export interface FooterProps {
	organization?: Organization | null;
	landingPage?: LandingPageSettings | null;
	primaryColor?: string;
}

export default function Footer({ organization, landingPage }: FooterProps) {
	const { t } = useTranslation();

	const location = {
		address: organization?.settings?.contactInfo?.address || t('footer.address'),
		phone: organization?.settings?.contactInfo?.phone || t('footer.phone'),
		email: organization?.settings?.contactInfo?.email || '',
	};
	const socialLinks = [
		landingPage?.social?.instagram && {
			href: landingPage.social.instagram,
			label: "Instagram",
			icon: <Instagram className="h-5 w-5" />,
		},
		landingPage?.social?.facebook && {
			href: landingPage.social.facebook,
			label: "Facebook",
			icon: <Facebook className="h-5 w-5" />,
		},
		landingPage?.social?.tiktok && {
			href: landingPage.social.tiktok,
			label: "TikTok",
			icon: <Music2 className="h-5 w-5" />,
		},
	].filter(Boolean) as Array<{ href: string; label: string; icon: React.ReactNode }>;

	const companyName = organization?.name || t('footer.companyName');
	const footerTagline = landingPage?.footerTagline;

	return (
		<footer className="bg-slate-900 text-slate-300">
			{/* Main footer */}
			<div className="max-w-7xl mx-auto px-6 py-16">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-12">
					{/* Brand column */}
					<div>
						<div className="mb-4">
							{landingPage?.branding?.logoUrl ? (
								<Image src={landingPage.branding.logoUrl} alt={companyName} width={120} height={40} className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
							) : (
								<span className="text-xl font-bold text-white">{companyName}</span>
							)}
						</div>
						{footerTagline && (
							<p className="text-slate-400 text-sm leading-relaxed mb-6">{footerTagline}</p>
						)}
						{socialLinks.length > 0 && (
							<div className="flex gap-3">
								{socialLinks.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-200"
										target="_blank"
										rel="noopener noreferrer"
										aria-label={link.label}
									>
										{link.icon}
									</Link>
								))}
							</div>
						)}
					</div>

					{/* Contact column */}
					<div>
						<h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">
							{t('footer.contact') || 'Contact'}
						</h3>
						<div className="space-y-4">
							{location.address && (
								<div className="flex gap-3 text-sm">
									<MapPin className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
									<span className="text-slate-400 leading-relaxed">{location.address}</span>
								</div>
							)}
							{location.phone && (
								<div className="flex gap-3 text-sm">
									<Phone className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
									<span className="text-slate-400">{location.phone}</span>
								</div>
							)}
							{location.email && (
								<div className="flex gap-3 text-sm">
									<Mail className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
									<span className="text-slate-400">{location.email}</span>
								</div>
							)}
						</div>
					</div>

					{/* Quick links column */}
					<div>
						<h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">
							{t('footer.quickLinks') || 'Quick Links'}
						</h3>
						<div className="space-y-3 text-sm">
							{[
								{ id: "services", label: t('nav.services') },
								{ id: "team", label: t('nav.team') },
								{ id: "gallery", label: t('nav.gallery') || 'Gallery' },
							].map(({ id, label }) => (
								<button
									key={id}
									onClick={() => {
										const el = document.getElementById(id);
										el?.scrollIntoView({ behavior: "smooth" });
									}}
									className="block text-slate-400 hover:text-white transition-colors"
								>
									{label}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Bottom bar */}
			<div className="border-t border-slate-800">
				<div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
					<span>© {new Date().getFullYear()} {companyName}. {t('footer.rights')}</span>
					<span>
						{t('footer.createdBy')}{' '}
						<Link
							href="https://elevatex.dev"
							className="text-slate-400 hover:text-white transition-colors"
							target="_blank"
							rel="noopener noreferrer"
						>
							ElevateX
						</Link>
					</span>
				</div>
			</div>
		</footer>
	);
}
