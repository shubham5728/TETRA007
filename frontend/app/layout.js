import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Poppins is not a variable font, so the weights we actually use are listed.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata = {
  title: "AURA CareLink | Intelligent Continuity of Care",
  description:
    "AI-powered continuity of care for patients after hospital discharge, built for rural and remote communities.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

// The root layout only sets up fonts and the page frame. The signed-in chrome
// (sidebar + header) lives in app/(workspace)/layout.js so the login screen can
// render full-bleed without it.
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-dvh bg-canvas antialiased">{children}</body>
    </html>
  );
}
