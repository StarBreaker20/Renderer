import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "rendrr v0.1 — Pause. Edit. Render.",
  description:
    "Upload a video, pause it into frames, edit text/logos/shapes/colors, and render deterministically with Remotion.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
