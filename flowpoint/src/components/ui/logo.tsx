import darkLogo from "@/assets/dark_bg_logo.png";
import whiteLogo from "@/assets/white_bg_logo.png";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className = "", width = 140, height = 45 }: LogoProps) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      // Check the actual DOM class that ThemeProvider sets
      const root = document.documentElement;
      setIsDark(root.classList.contains("dark"));
    };

    updateTheme();

    // Listen for theme changes via MutationObserver to catch ThemeProvider updates
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Listen for system theme changes if using system theme
    let mediaQuery: MediaQueryList | null = null;
    let handleChange: (() => void) | null = null;
    if (theme === "system") {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      handleChange = () => {
        // Small delay to ensure ThemeProvider has updated the DOM
        setTimeout(updateTheme, 0);
      };
      mediaQuery.addEventListener("change", handleChange);
    }

    return () => {
      observer.disconnect();
      if (mediaQuery && handleChange) {
        mediaQuery.removeEventListener("change", handleChange);
      }
    };
  }, [theme]);

  const logoSrc = isDark ? darkLogo : whiteLogo;

  return (
    <img
      src={logoSrc}
      alt="Logo"
      width={width}
      height={height}
      className={className}
    />
  );
}
