import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bg" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-black text-gray-300 min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
