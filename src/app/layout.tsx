import { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./client-layout";

export const metadata: Metadata = {
  title: "DOGGY OnRamp | Compra DOGGY con SPEI",
  description: "Compra tokens DOGGY directamente con SPEI. Sin complicaciones, sin exchanges.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#050d1f] text-white antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
