import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";

import { Inter } from "next/font/google";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Inhumane",
  description: "Your AI operator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}`}>
        <GlobalProviders>{children}</GlobalProviders>
      </body>
    </html>
  );
}
