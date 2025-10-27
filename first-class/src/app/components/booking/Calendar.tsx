"use client"

import { Link, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { cn, formatTimeSlot, navigateMonth, generateCalendarDays, isDateInPast } from "@/lib/utils"
import { motion } from "framer-motion"
import type { Barber } from "@/stores/types/booking-modal.types"
import Image from "next/image"
import type { Dispatch, SetStateAction } from "react"
import { useTranslation } from "@/lib/useTranslation"
import { TimeSlot } from "@/app/types/Timeslot"
import { slideAnimation } from "./animations"
import type { Service } from "@/core"

// Constants
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface CalendarProps {
  selectedBarber: Barber | null
  selectedService: Service | null
  selectedDate: number | null
  selectedTime: string | null
  currentMonth: number
  currentYear: number
  direction: number
  isLoadingTimeSlots: boolean
  availableTimeSlots: TimeSlot[]
  services: Service[]
  handleDateSelect: (day: number | null) => void
  handleTimeSelect: (time: string) => void
  handleBackToBarber: () => void
  setSelectedService: Dispatch<SetStateAction<Service | null>>
  onNavigateMonth: (newMonth: number, newYear: number) => void
}

export const Calendar = ({
  selectedBarber,
  selectedService,
  selectedDate,
  selectedTime,
  currentMonth,
  currentYear,
  direction,
  isLoadingTimeSlots,
  availableTimeSlots,
  services,
  handleDateSelect,
  handleTimeSelect,
  handleBackToBarber,
  setSelectedService,
  onNavigateMonth,
}: CalendarProps) => {
  const today = new Date()
  const { t } = useTranslation()

  const handleNavigateMonth = (direction: "prev" | "next") => {
    const { newMonth, newYear } = navigateMonth(direction, currentMonth, currentYear)
    onNavigateMonth(newMonth, newYear)
    handleDateSelect(null)
  }

  return (
    <motion.div
      key="datetime"
      custom={direction}
      variants={slideAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        scale: { type: "spring", stiffness: 400, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="overflow-y-auto"
    >
      <div
        className={cn(
          "grid grid-cols-1",
          selectedDate && selectedService
            ? "lg:grid-cols-[30%_1fr_25%] lg:h-full"
            : "lg:grid-cols-[50%_1fr] lg:h-full",
        )}
      >
        {/* Left Sidebar */}
        <div className="border-b lg:border-b-0 lg:border-r p-4 bg-background lg:max-h-[60vh] lg:overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleBackToBarber} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">{t('booking.title')}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{t('booking.select')}</p>
            </div>
            {selectedBarber && (
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Image
                    src={selectedBarber.image || "/placeholder.svg"}
                    alt={selectedBarber.name}
                    width={300}
                    height={400}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{selectedBarber.name}</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleBackToBarber} className="text-sm">
                    {t('booking.change')}
                  </Button>
                </div>
              </div>
            )}

            {/* Service Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('booking.service')}</Label>
              <div className="space-y-2">
                {services.map((service) => (
                  <Button
                    key={service.id}
                    variant={selectedService?.id === service.id ? "default" : "outline"}
                    className={cn(
                      "w-full justify-between h-auto py-3 px-4",
                      selectedService?.id === service.id && "bg-primary text-primary-foreground",
                    )}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-sm opacity-90">{service.duration} {t('booking.minutes')}</span>
                    </div>
                    <span className="text-sm font-medium">{service.price}lv.</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{selectedService?.duration || 30} {t('booking.minutes')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link className="h-4 w-4" />
                <span>{t('booking.inPerson')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Calendar */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg md:text-xl font-medium">
                {months[currentMonth]} {currentYear}
              </h2>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavigateMonth("prev")}
                  disabled={currentYear === today.getFullYear() && currentMonth === today.getMonth()}
                  className="h-7 w-7 md:h-8 md:w-8 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavigateMonth("next")}
                  className="h-7 w-7 md:h-8 md:w-8 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 md:gap-3 lg:max-w-3xl lg:mx-auto">
            {days.map((day, idx) => (
              <div key={idx} className="text-xs font-medium text-muted-foreground text-center py-1 md:py-2">
                {day}
              </div>
            ))}
            {generateCalendarDays(currentMonth, currentYear).map((day, index) => (
              <Button
                key={index}
                variant={day === selectedDate ? "default" : "ghost"}
                className={cn(
                  "h-8 md:h-12 text-sm md:text-base p-0 rounded-full",
                  !day && "invisible",
                  isDateInPast(day, currentMonth, currentYear) && "text-muted-foreground opacity-50",
                  day === selectedDate &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                  day && !isDateInPast(day, currentMonth, currentYear) && day !== selectedDate && "hover:bg-muted",
                )}
                onClick={() => handleDateSelect(day)}
                disabled={!day || isDateInPast(day, currentMonth, currentYear)}
              >
                {day}
              </Button>
            ))}
          </div>
        </div>

        {selectedDate && selectedService && (
          <>
            {/* Desktop version */}
            <div className="hidden lg:h-full lg:w-full lg:flex lg:flex-col border-l">
              <div className="p-4 border-b sticky top-0 bg-background z-10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">
                      {`${days[new Date(currentYear, currentMonth, selectedDate).getDay()].charAt(0)}${days[new Date(currentYear, currentMonth, selectedDate).getDay()].slice(1).toLowerCase()}`}
                    </h3>
                    <span className="text-muted-foreground text-sm">{selectedDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2 flex-1 lg:max-h-[calc(60vh-4rem)]">
                  {isLoadingTimeSlots ? (
                    <div className="text-center py-4">{t('booking.loadingTimeSlots')}</div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">{t('booking.noTimeSlots')}</div>
                  ) : (
                    availableTimeSlots.map((slot, idx) => {
                      const displayTime = formatTimeSlot(slot.start_time);
                      return (
                        <Button
                          key={idx}
                          variant={selectedTime === slot.start_time ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start text-left transition-colors h-10 rounded-md",
                            selectedTime === slot.start_time && "bg-primary text-primary-foreground",
                            "hover:bg-muted",
                          )}
                          onClick={() => handleTimeSelect(slot.start_time)}
                        >
                          <span className="text-sm">{displayTime}</span>
                        </Button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Mobile/Tablet version */}
            <div className="block lg:hidden">
              <div className="bg-background">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {`${days[new Date(currentYear, currentMonth, selectedDate).getDay()].charAt(0)}${days[new Date(currentYear, currentMonth, selectedDate).getDay()].slice(1).toLowerCase()}`}
                      </h3>
                      <span className="text-muted-foreground text-sm">{selectedDate}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('booking.selectTime')}</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {isLoadingTimeSlots ? (
                    <div className="text-center py-4">{t('booking.loadingTimeSlots')}</div>
                  ) : availableTimeSlots.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">{t('booking.noTimeSlots')}</div>
                  ) : (
                    availableTimeSlots.map((slot, idx) => {
                      const displayTime = formatTimeSlot(slot.start_time);
                      return (
                        <Button
                          key={idx}
                          variant={selectedTime === slot.start_time ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-center h-12 text-base",
                            selectedTime === slot.start_time && "bg-primary text-primary-foreground",
                          )}
                          onClick={() => handleTimeSelect(slot.start_time)}
                        >
                          {displayTime}
                        </Button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}