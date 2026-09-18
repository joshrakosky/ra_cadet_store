import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Republic Airways Cadet Kits",
  description: "Cadet kit selection for Republic Airways",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
