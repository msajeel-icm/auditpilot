import type { Metadata } from "next";
import "./globals.css";
import "../styles/tokens.css";

export const metadata: Metadata = {
  title: "AuditPilot",
  description: "Medicaid audit prep for IDD/LTC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
