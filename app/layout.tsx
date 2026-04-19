import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeepDelta: Launch AI You Can Trust, for Deep-Sea Knowledge",
  description:
    "A verification layer that exposes the gaps, conflicts, and decay in AI answers about the deep sea. Built on the Human Delta playbook.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased text-abyss-900">{children}</body>
    </html>
  );
}
