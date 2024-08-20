import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zudoku - Open Source API Documentation",
  description:
    "Zudoku is an Open Source framework for building OpenAPI and GraphQL schema powered documentation websites.",
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
