import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Totofanta",
  description:
    "Il last man standing del calcio tra amici: una squadra a giornata, chi sbaglia esce.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Manrope:wght@500;700;800&family=JetBrains+Mono:wght@500&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
