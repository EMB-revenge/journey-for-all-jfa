import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { AuthProvider } from "~/context/AuthContext";
import { BookingFlowProvider } from "~/context/BookingFlowProvider";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "JFA Transit",
  description: "Intercity bus booking, made simple.",
  icons: {
    icon: "/Logo.png",
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen font-sans antialiased">
        <TRPCReactProvider>
          <AuthProvider>
            <BookingFlowProvider>{children}</BookingFlowProvider>
          </AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
