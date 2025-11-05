"use client";

import { cn } from "@/lib/utils";

interface ScrollDownButtonProps {
  targetSectionId: string;
  className?: string; // Additional custom classes
}

const ScrollDownButton: React.FC<ScrollDownButtonProps> = ({
  targetSectionId,
  className,
}) => {
  const handleScroll = () => {
    const targetElement = document.getElementById(targetSectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className={cn(`relative h-16 w-8 border-2 border-white rounded-full cursor-pointer overflow-hidden`, className)}
      onClick={handleScroll}
    >
      <span
        className="absolute h-2.5 w-2.5 border-2 border-white border-t-0 border-l-0 rotate-45 left-1/2 top-2 -translate-x-1/2 animate-scroll-down"
        style={{ animationDelay: "0.3s" }}
      />
      <span
        className="absolute h-2.5 w-2.5 border-2 border-white border-t-0 border-l-0 rotate-45 left-1/2 top-2 -translate-x-1/2 animate-scroll-down"
      />
    </div>
  );
};

export default ScrollDownButton;
