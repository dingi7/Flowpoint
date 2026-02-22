import { TestimonialsSection } from "@/templates/shared/sections/TestimonialsSection";

export interface GalleryProps {
	imageUrls?: string[];
	title?: string;
	primaryColor?: string;
}

export const Gallery = ({ imageUrls = [], title, primaryColor = "#0f766e" }: GalleryProps) => {
	return (
		<TestimonialsSection
			imageUrls={imageUrls}
			title={title}
			sectionClassName="bg-slate-50 py-24 md:py-32"
			headingClassName='text-slate-900 font-["Playfair_Display",_Georgia,_serif]'
			loadingTrackClassName="bg-slate-200"
			loadingBarClassName=""
			loadingBarStyle={{ background: primaryColor }}
			loadingTextClassName="text-slate-500"
			carouselImageClassName="rounded-2xl"
			eyebrowColor={primaryColor}
		/>
	);
};
