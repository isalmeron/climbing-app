import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import type { Metadata, Viewport } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Climbing Training",
  description: "Entrenamiento de escalada con tu entrenador.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c8599",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" {...mantineHtmlProps}>
      <head>
        <React.Suspense fallback={null}>
          <ColorSchemeScript />
        </React.Suspense>
      </head>
      <body>
        <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
