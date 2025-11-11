import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Agentic LinkedIn Post Generator",
  description:
    "Generate high-impact LinkedIn posts with tailored visuals and messaging."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
