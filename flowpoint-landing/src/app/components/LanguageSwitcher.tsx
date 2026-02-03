"use client";

import {
    useLocale,
} from "@/app/context/LocaleContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import Image from "next/image";

import BG from "@/../public/flags/bg.svg";
import GB from "@/../public/flags/uk.svg";
import TR from "@/../public/flags/tr.svg";

export function LanguageSwitcher() {
  const { locale, setLocale, isLoading } = useLocale();

  if (isLoading) {
    return (
      <div
        className={`animate-pulse bg-gray-200 rounded-md h-10 w-24`}
      />
    );
  }

  return (
    <Select value={locale} onValueChange={setLocale}>
      <SelectTrigger className="w-[100px]">
        <SelectValue>
          {locale === "bg" ? (
            <span className="flex items-center gap-2">
              <Image src={BG} alt="BG" width={20} height={20} /> BG
            </span>
          ) : locale === "tr" ? (
            <span className="flex items-center gap-2">
              <Image src={TR} alt="TR" width={20} height={20} /> TR
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Image src={GB} alt="GB" width={20} height={20} /> EN
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">
          <span className="flex items-center gap-2">
            <Image src={GB} alt="GB" width={20} height={20} /> EN
          </span>
        </SelectItem>
        <SelectItem value="bg">
          <span className="flex items-center gap-2">
            <Image src={BG} alt="BG" width={20} height={20} /> BG
          </span>
        </SelectItem>
        <SelectItem value="tr">
          <span className="flex items-center gap-2">
            <Image src={TR} alt="TR" width={20} height={20} /> TR
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
