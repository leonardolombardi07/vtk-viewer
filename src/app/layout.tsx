import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VTK Viewer",
  description:
    "Example of how to use vtk.js to upload and visualize vtk files.",
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
