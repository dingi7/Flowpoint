'use client';

import { Instagram, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/useTranslation";

export default function Footer() {
	const { t } = useTranslation();

	const location = {
		address: t('footer.address'),
		mapUrl: 'https://www.google.com/maps/place/Grand+Mall/@43.2177383,27.898116,19.5z/data=!4m6!3m5!1s0x40a45486577bb3f7:0x5226892607aebd19!8m2!3d43.2179289!4d27.8983329!16s%2Fg%2F1tj5jn5g?entry=ttu&g_ep=EgoyMDI1MDEyMi4wIKXMDSoASAFQAw%3D%3D',
		phone: t('footer.phone'),
		workingHours: {
			weekdays: '10:00 - 20:00',
			weekend: '10:00 - 20:00'
		}
	};

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
					<div className="flex gap-4 justify-end">
						<Link
							href="https://www.instagram.com/burixcuts?igsh=cWhzdDY3YjZkM3d3"
							className="text-gray-400 hover:text-white transition-colors"
							target="_blank"
							rel="noopener noreferrer"
						>
							<Instagram className="h-6 w-6" />
						</Link>
					</div>
				</div>
				<div className="mt-8 text-center text-gray-400">
					© {new Date().getFullYear()} {t('footer.companyName')}. {t('footer.rights')}
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
