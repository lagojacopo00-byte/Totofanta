import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Totofanta",
  description:
    "Scegli la squadra vincente. Sbagli, sei fuori. Il last man standing di Serie A tra amici.",
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
