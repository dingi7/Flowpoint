'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from "@/lib/useTranslation";

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const TOTAL_IMAGES = 11;

export interface TestimonialsProps {
	imageUrls?: string[];
	title?: string;
}

export const Testimonials = ({ imageUrls = [], title }: TestimonialsProps) => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(true);
	const [loadedImagesCount, setLoadedImagesCount] = useState(0);
	const resolvedImages = useMemo(
		() =>
			imageUrls.length > 0
				? imageUrls
				: Array.from(
						{ length: TOTAL_IMAGES },
						(_, i) => `/testimonials/Testimonials${i + 1}.webp`,
					),
		[imageUrls.join("|")],
	);
	const resolvedTitle = title || t('gallery.title');

	useEffect(() => {
		const preloadImages = async () => {
			setIsLoading(true);
			setLoadedImagesCount(0);
			const imagePromises = resolvedImages.map((src) => {
				return new Promise((resolve, reject) => {
					const img = document.createElement('img');
					img.src = src;
					img.onload = () => {
						setLoadedImagesCount(prev => prev + 1);
						resolve(true);
					};
					img.onerror = reject;
				});
			});

			try {
				await Promise.all(imagePromises);
				setIsLoading(false);
			} catch (error) {
				console.error('Failed to load some images:', error);
				setIsLoading(false);
			}
		};

		preloadImages();
	}, [resolvedImages]);

	const loadingProgress = Math.round(
		(loadedImagesCount / resolvedImages.length) * 100
	);

	return (
		<section id="gallery" className="py-[5%] overflow-hidden">
			<div className="container mx-auto px-4">
				<h1 className="text-4xl md:text-5xl font-bold mb-9 text-white text-center">
					{resolvedTitle}
				</h1>

				{isLoading ? (
					<div className="flex flex-col items-center justify-center min-h-[300px]">
						<div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
							<div 
								className="bg-primary h-2.5 rounded-full transition-all duration-300" 
								style={{ width: `${loadingProgress}%` }}
							/>
						</div>
						<p className="text-white text-sm">{loadingProgress}% {t('gallery.loading')}</p>
					</div>
				) : (
					<div className="w-full max-w-[1400px] mx-auto">
						<Swiper
							modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
							effect="coverflow"
							grabCursor={true}
							centeredSlides={true}
							slidesPerView="auto"
							initialSlide={2}
							coverflowEffect={{
								rotate: 0,
								stretch: 0,
								depth: 100,
								modifier: 2.5,
								slideShadows: true,
							}}
							autoplay={{
								delay: 3000,
								disableOnInteraction: false,
								pauseOnMouseEnter: true
							}}
							loop={true}
							className="mySwiper !pb-12"
						>
							{resolvedImages.map((src, i) => (
								<SwiperSlide 
									key={`${src}-${i}`} 
									className="!w-[95%] sm:!w-[65%] lg:!w-[45%] transition-transform duration-300 hover:scale-[1.02]"
                                    
								>
									<div className="aspect-square relative rounded-lg overflow-hidden">
										<img
											src={src}
											alt={`${t('gallery.client')} ${i + 1}`}
											className="h-full w-full object-cover"
											loading={i < 3 ? "eager" : "lazy"}
										/>
									</div>
								</SwiperSlide>
							))}
						</Swiper>
					</div>
				)}
			</div>
		</section>
	);
};
