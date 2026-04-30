import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Dashboard",
  description: "A local dashboard for weight, steps, and calorie-burn trends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
