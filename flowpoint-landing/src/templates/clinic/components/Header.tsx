"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/useTranslation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useBookingModalStore } from "@/stores/booking-modal-store";

export interface HeaderProps {
  logoUrl?: string;
  organizationName?: string;
  primaryColor?: string;
}

export default function Header({ logoUrl, organizationName, primaryColor = "#0f766e" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();
  const { openModal } = useBookingModalStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 72;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/98 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 shrink-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={organizationName || "Logo"}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${
              isScrolled ? "text-slate-900" : "text-white"
            }`}>
              {organizationName || "Clinic"}
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:items-center lg:gap-1">
          {[
            { id: "hero", label: t('nav.home') },
            { id: "services", label: t('nav.services') },
            { id: "team", label: t('nav.team') },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded-lg hover:bg-white/10 ${
                isScrolled ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50" : "text-white/80 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="ml-2 mr-4">
            <LanguageSwitcher />
          </div>

          <button
            onClick={() => openModal()}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:opacity-90 hover:shadow-lg hover:scale-105 active:scale-100"
            style={{ background: primaryColor }}
          >
            {t('hero.bookNow') || 'Book Now'}
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 lg:hidden">
          <LanguageSwitcher />
          <button
            className={`p-2 rounded-lg transition-colors ${
              isScrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={t("nav.toggleMenu")}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        } bg-white border-t border-slate-100`}
      >
        <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-1">
          {[
            { id: "hero", label: t('nav.home') },
            { id: "services", label: t('nav.services') },
            { id: "team", label: t('nav.team') },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="text-left px-4 py-3 text-slate-700 font-medium hover:bg-slate-50 rounded-xl transition-colors text-base"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => { openModal(); setIsMenuOpen(false); }}
            className="mt-3 w-full py-3 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90"
            style={{ background: primaryColor }}
          >
            {t('hero.bookNow') || 'Book Now'}
          </button>
        </nav>
      </div>
    </header>
  );
}
