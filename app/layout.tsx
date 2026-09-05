import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ThemeProvider } from "./components/ThemeProvider";
import { ClientShell } from "./components/layout/ClientShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tinat | Research Ecosystem",
  description: "Participate in research. Contribute knowledge. Earn Tinat Credits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/*
            ClientShell detects whether we are inside a dashboard route.
            If yes → renders children only (dashboards have their own shell).
            If no  → wraps children with the public Navbar and Footer.
          */}
          <ClientShell navbar={<Navbar />} footer={<Footer />}>
            {children}
          </ClientShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
