import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], display: "swap" });
const sans = Manrope({ variable: "--font-ui", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: `A few words, a beautiful difference | ${siteConfig.businessName}`,
  description: `Thank you for choosing ${siteConfig.businessName} — ${siteConfig.businessDescriptor}. Share your salon experience with a little review inspiration, then leave your review on Google.`,
  robots: { index: false, follow: false },
  icons: { icon: "/logo/logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${display.variable} ${sans.variable}`}><body>{children}</body></html>;
}
