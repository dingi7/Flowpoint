"use client";

import Link from "next/link";
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from "react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "@/lib/useTranslation";
import logo from "@/../public/logo.jpg"
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();

  // Add scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Height of your header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-[#2B4238]/20"
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3 group">
          <Image
            src={logo}
            alt="Logo"
            width={140}
            height={45}
            className="object-cover opacity-95"
          />
        </Link>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-4 lg:hidden">
          <LanguageSwitcher />
          <button
            className="text-white hover:text-[#2B4238] transition-colors p-2"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex lg:items-center lg:gap-8">
          <ul className="flex gap-8 text-white">
            <li>
              <button
                onClick={() => scrollToSection("hero")}
                className="hover:text-[#2B4238] transition-colors relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-[#2B4238] after:transition-all hover:after:w-full"
              >
                {t('nav.home')}
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("services")}
                className="hover:text-[#2B4238] transition-colors relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-[#2B4238] after:transition-all hover:after:w-full"
              >
                {t('nav.services')}
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("team")}
                className="hover:text-[#2B4238] transition-colors relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-[#2B4238] after:transition-all hover:after:w-full"
              >
                {t('nav.team')}
              </button>
            </li>
          </ul>
            <LanguageSwitcher />
        </nav>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`lg:hidden fixed w-full left-0 top-[73px] ${
          isScrolled ? "bg-black/95 backdrop-blur-sm border-t border-[#2B4238]/20" : "bg-black/95 backdrop-blur-sm"
        } transform transition-all duration-300 ease-in-out ${
          isMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <nav className="container mx-auto px-4 py-6">
          <ul className="flex flex-col gap-6 text-white">
            <li>
              <button
                onClick={() => scrollToSection("hero")}
                className="block hover:text-[#2B4238] transition-colors py-2 w-full text-left text-lg"
              >
                {t('nav.home')}
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("services")}
                className="block hover:text-[#2B4238] transition-colors py-2 w-full text-left text-lg"
              >
                {t('nav.services')}
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection("team")}
                className="block hover:text-[#2B4238] transition-colors py-2 w-full text-left text-lg"
              >
                {t('nav.team')}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
