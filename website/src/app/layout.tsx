import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zudoku - Open Source Developer Portal",
  description:
    "Zudoku is an Open Source Framework for building Developer Portals",
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
