import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { BrandingProvider } from "@/contexts/branding-context";
import { ToastProvider } from "@/components/ui/toast";
import { ModalContainer } from "@/components/modals/modal-container";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Content Approval App",
  description: "Manage and approve social media content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ToastProvider>
          <BrandingProvider>
            <main className="flex-1">
              {children}
            </main>
            <ModalContainer />
          </BrandingProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
