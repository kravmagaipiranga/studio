import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ['400', '700'] 
});

export const metadata: Metadata = {
  title: "Krav Magá IPIRANGA - Gestão",
  description: "Gestão de alunos e financeira para Krav Magá IPIRANGA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={ptSans.className}>
        <AppLayout>{children}</AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
