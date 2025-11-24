import { Scissors } from "lucide-react";
import { FadeInView } from "./FadeInView";
import { useTranslation } from "@/lib/useTranslation";
import { Member } from "@/core";
import Image from "next/image";
import { useBookingModalStore } from "@/stores/booking-modal-store";
import { Barber } from "@/stores/types/booking-modal.types";
import { getLocalizedMemberValue } from "@/lib/member-localization";

export function MemberCard({
  member,
  index,
}: {
  member: Member;
  index: number;
}) {
  const { t, locale } = useTranslation();
  const { setInitialBarber, openModal } = useBookingModalStore();

  // Get localized name and description with fallback chain
  const localizedName = getLocalizedMemberValue(member, "name", locale);
  const localizedDescription = getLocalizedMemberValue(
    member,
    "description",
    locale
  );

  const handleBookNow = () => {
    // Convert Member to Barber format
    const barber: Barber = {
      id: member.id,
      name: localizedName,
      image: member.image,
      description: localizedDescription,
      working: true, // Assume all members are working
    };

    // Set the initial barber and open the modal
    setInitialBarber(barber);
    openModal();
  };

  return (
    <FadeInView key={member.id} delay={index * 0.2}>
      <div className="bg-[#1C1C1C] flex flex-col items-center text-center group hover:bg-[#242424] transition-colors duration-300 border-2 border-[#242424] shadow-[4px_4px_0px_0px_rgba(36,36,36,0.5)] w-[90vw] sm:w-[85vw] md:w-[28rem] max-w-full">
        <div className="relative w-full aspect-square overflow-hidden">
          <Image
            src={member.image || "/placeholder.svg"}
            alt={localizedName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 90vw, (max-width: 768px) 85vw, 28rem"
            priority={index < 3}
            loading={index < 3 ? undefined : "lazy"}
            fetchPriority={index < 3 ? "high" : "auto"}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
        </div>
        <div className="p-8">
          <h3 className="text-white text-xl font-bold mb-2 flex items-center justify-center">
            <Scissors className="w-5 h-5 mr-2 text-[#B5A48A]" />
            {localizedName}
          </h3>
          <div className="flex justify-center space-x-4 mb-6">
            <span>{localizedDescription}</span>
          </div>
          {member.status === "active" && (
            <button
              onClick={handleBookNow}
              className="cursor-pointer w-full bg-[#B5A48A] text-[#0A0A0A] py-2 font-semibold hover:bg-[#C8B79D] transition-colors duration-300"
            >
              {t("team.bookNow")}
            </button>
          )}
        </div>
      </div>
    </FadeInView>
  );
}
