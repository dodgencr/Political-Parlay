import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Florida Influence Ledger",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
