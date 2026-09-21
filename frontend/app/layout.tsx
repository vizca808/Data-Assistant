import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Data Assistant",
  description: "Upload data CSV, Excel, atau PDF dan jalankan visualisasi dan analitik dengan machine learning lokal.",
  keywords: ["AI", "analisis data", "Auto-EDA", "CSV", "Excel", "PDF", "scikit-learn"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={cn("dark", "font-sans", geist.variable)}>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
