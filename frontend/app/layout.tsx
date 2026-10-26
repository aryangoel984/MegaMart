import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import ColdStartBanner from "@/components/ColdStartBanner";
import GuestBanner from "@/components/GuestBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mega-mart-one.vercel.app"),
  title: {
    template: "%s · MegaMart.ai",
    default: "MegaMart.ai — AI-native shopping",
  },
  description:
    "Shop MegaMart.ai: semantic product search, AI recommendations, and a tool-using shopping agent that can search, cart and check out for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ColdStartBanner />
        <GuestBanner />
        <main>{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
