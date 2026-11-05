import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { ThemeProvider } from "./components/ThemeProvider";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { ClientShell } from "./components/layout/ClientShell";

export const metadata: Metadata = {
  title: "Tinat | Research Ecosystem",
  description: "Participate in research. Contribute knowledge. Earn Tinat Credits.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon-32x32.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/tinat-mark.png?v=2", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
  },
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
      className="h-full antialiased scroll-smooth"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Ethiopic:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground ">
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
          <ConfirmProvider>
            <ClientShell navbar={<Navbar />} footer={<Footer />}>
              {children}
            </ClientShell>
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
