import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Social Debt Adaptive Model",
  description: "Detect and classify communication breakdowns",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overscroll-none">
      <body className={`${outfit.className} antialiased overscroll-none`}>
        {children}
      </body>
    </html>
  );
}
