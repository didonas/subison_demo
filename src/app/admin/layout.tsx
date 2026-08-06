import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Portal | Subison Neuro Centre",
  description: "Administrative Portal for Hospital Operations and Patient Care",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
