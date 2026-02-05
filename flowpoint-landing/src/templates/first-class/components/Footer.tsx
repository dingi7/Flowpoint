'use client';

import { Facebook, Instagram, MapPin, Music2, Phone } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";
import { LandingPageSettings, Organization } from "@/core";

export interface FooterProps {
	organization?: Organization | null;
	landingPage?: LandingPageSettings | null;
}

export default function Footer({ organization, landingPage }: FooterProps) {
	const { t } = useTranslation();

	const location = {
		address: organization?.settings?.contactInfo?.address || t('footer.address'),
		mapUrl: organization?.settings?.contactInfo?.googleMapsUrl || "",
		phone: organization?.settings?.contactInfo?.phone || t('footer.phone'),
		workingHours: {
			weekdays: '10:00 - 20:00',
			weekend: '10:00 - 20:00'
		}
	};
	const socialLinks = [
		landingPage?.social?.instagram && {
			href: landingPage.social.instagram,
			label: "Instagram",
			icon: <Instagram className="h-6 w-6" />,
		},
		landingPage?.social?.facebook && {
			href: landingPage.social.facebook,
			label: "Facebook",
			icon: <Facebook className="h-6 w-6" />,
		},
		landingPage?.social?.tiktok && {
			href: landingPage.social.tiktok,
			label: "TikTok",
			icon: <Music2 className="h-6 w-6" />,
		},
	].filter(Boolean) as Array<{ href: string; label: string; icon: JSX.Element }>;
	const companyName = organization?.name || t('footer.companyName');

	return (
		<footer className="border-t py-8 bg-black">
			<div className="container mx-auto px-4">
				<div className="flex flex-col md:flex-row gap-8 md:gap-4 justify-between items-center">
					<div className="text-center md:text-left">
						<div className="flex flex-col gap-2 items-center md:items-start">
							<div className="flex  md:items-center gap-2">
								<MapPin className="h-5 w-5 text-[#98B8A0]" />
								<p className="text-gray-400">{location.address}</p>
							</div>
							<div className="flex items-center gap-2">
								<Phone className="h-5 w-5 text-[#98B8A0]" />
								<p className="text-gray-400">{location.phone}</p>
							</div>
						</div>
					</div>
					{/* <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
						<Link
							href="#"
							className="text-gray-400 hover:text-white transition-colors"
						>
							{t('footer.links.cookies')}
						</Link>
						<Link
							href="#"
							className="text-gray-400 hover:text-white transition-colors"
						>
							{t('footer.links.terms')}
						</Link>
						<Link
							href="#"
							className="text-gray-400 hover:text-white transition-colors"
						>
							{t('footer.links.privacy')}
						</Link>
					</div> */}
					{socialLinks.length > 0 && (
						<div className="flex gap-4 justify-end">
							{socialLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-gray-400 hover:text-white transition-colors"
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
				<div className="mt-8 text-center text-gray-400">
					© {new Date().getFullYear()} {companyName}. {t('footer.rights')}
					<div className="mt-2">
						{t('footer.createdBy')}{' '}
						<Link
							href="https://elevatex.dev"
							className="text-gray-400 hover:text-white transition-colors"
							target="_blank"
							rel="noopener noreferrer"
						>
							ElevateX
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
