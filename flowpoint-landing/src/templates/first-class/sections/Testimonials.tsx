import { TestimonialsSection } from "@/templates/shared/sections/TestimonialsSection";

export interface TestimonialsProps {
	imageUrls?: string[];
	title?: string;
}

export const Testimonials = ({ imageUrls = [], title }: TestimonialsProps) => {
	return (
		<TestimonialsSection
			imageUrls={imageUrls}
			title={title}
			sectionClassName="py-[5%]"
			headingClassName="mb-9 text-white"
			loadingTrackClassName="bg-gray-200 dark:bg-gray-700"
			loadingBarClassName="bg-primary"
			loadingTextClassName="text-white"
			carouselImageClassName="rounded-lg"
		/>
	);
};
