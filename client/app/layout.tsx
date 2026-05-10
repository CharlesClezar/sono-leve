import type { Metadata } from "next";
import { Providers } from "./providers";
import "../src/index.css";

export const metadata: Metadata = {
  title: "Sono Leve",
  description: "Gestao operacional Sono Leve",
  icons: {
    icon: "/sono-leve-logo.svg",
    shortcut: "/sono-leve-logo.svg",
    apple: "/sono-leve-logo.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
