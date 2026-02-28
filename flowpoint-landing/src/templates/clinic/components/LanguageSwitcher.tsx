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
} from "@/app/components/ui/select";
import Image from "next/image";

import BG from "@/../public/flags/bg.svg";
import GB from "@/../public/flags/uk.svg";
import TR from "@/../public/flags/tr.svg";

export function LanguageSwitcher() {
  const { locale, setLocale, isLoading } = useLocale();

  if (isLoading) {
    return (
      <div
        className={`h-10 w-14 animate-pulse rounded-md bg-slate-200`}
      />
    );
  }

  return (
    <Select value={locale} onValueChange={setLocale}>
      <SelectTrigger className="border-slate-300 items-center  text-slate-700">
        <SelectValue className="sr-only" />
      </SelectTrigger>
      <SelectContent className="min-w-[3.5rem]">
        <SelectItem value="en" className="justify-center">
          <span className="flex items-center justify-center">
            <Image src={GB} alt="GB" width={24} height={24} />
          </span>
        </SelectItem>
        <SelectItem value="bg" className="justify-center">
          <span className="flex items-center justify-center">
            <Image src={BG} alt="BG" width={24} height={24} />
          </span>
        </SelectItem>
        <SelectItem value="tr" className="justify-center">
          <span className="flex items-center justify-center">
            <Image src={TR} alt="TR" width={24} height={24} />
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
