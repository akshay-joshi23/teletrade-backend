import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TeleTrades",
  description: "Functional core app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  );
}


