import type { Metadata } from "next";
import "./globals.css"; // Importa o CSS global da pasta public

export const metadata: Metadata = {
  title: "NUGARCSYS",
  description: "Seu portal para gestão e transparência de dados governamentais.",
    generator: 'v0.dev'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
