import type { Metadata } from "next";
import "./globals.css";
import "./patriotic.css";
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: "Political Parlay | Public records. Shared accountability.",
  description: "Source-linked campaign finance, lobbying and financial disclosures for Florida's congressional delegation.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><SiteHeader/>{children}</body>
    </html>
  );
}
