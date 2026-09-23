import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { resolveTheme, THEME_COOKIE_NAME } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Totofanta",
  description:
    "Scegli la squadra vincente. Sbagli, sei fuori. Il last man standing di Serie A tra amici.",
};

// viewportFit "cover" fa disegnare la pagina fin sotto le aree "sicure"
// del telefono (tacca, barra gesture in basso su iPhone): senza, i
// valori env(safe-area-inset-*) restano sempre 0 e non hanno alcun
// effetto — serve alla barra flottante del torneo per non restare
// nascosta sotto la barra gesture (vedi tournament-footer-nav.tsx).
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const theme = resolveTheme(cookieStore.get(THEME_COOKIE_NAME)?.value);

  return (
    <html lang="it" data-theme={theme} className="h-full antialiased">
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
