import React from 'react';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingContact } from "@/components/FloatingContact";
import content from "@/data/site-content.json";
import "./globals.css";

export function generateMetadata() {
  return {
    title: `${content.site.name} | Premium High-End Jewelry`,
    description: content.site.tagline,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-full font-sans antialiased text-black bg-white selection:bg-black selection:text-white">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}
