import type { Metadata } from "next";
import { Inter } from "next/font/google"; // ← replace Geist with Inter
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CWT IT Inventory",
  description: "Inventory system for storing customs documents for PLB PT. CWT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="superblog-theme"
        >
          <Navbar />
          <main className="px-6">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
