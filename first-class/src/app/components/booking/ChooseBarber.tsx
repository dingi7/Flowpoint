import { motion } from "framer-motion"
import { Button } from "../ui/button"
import Image from "next/image"
import { Barber } from "@/stores/types/booking-modal.types"
import { useTranslation } from "@/lib/useTranslation"
import { slideAnimation } from "./animations"

interface ChooseBarberProps {
  direction: number;
  barbers: Barber[];
  handleBarberSelect: (barber: Barber) => void;
}

export const ChooseBarber = ({ direction, barbers, handleBarberSelect }: ChooseBarberProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      key="barber"
      custom={direction}
      variants={slideAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        scale: { type: "spring", stiffness: 400, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="p-4 md:p-6"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg md:text-xl font-semibold">{t('booking.selectBarber')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('booking.selectBarberDescription')}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
          {barbers.map((barber) => (
            <Button
              key={barber.id}
              variant="outline"
              className="h-auto flex flex-col items-center gap-3 dark:hover:bg-muted/50 w-full p-3"
              onClick={() => handleBarberSelect(barber)}
            >
              <div className="w-full aspect-square relative">
                <Image
                  src={barber.image || "/placeholder.svg"}
                  alt={barber.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
              <h3 className="font-semibold text-lg">{barber.name}</h3>
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}