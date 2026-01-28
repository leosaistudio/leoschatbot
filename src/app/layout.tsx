import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "ChatBot AI | צ'אטבוט חכם לאתר שלך",
  description: "פלטפורמת צ'אטבוטים מבוססת AI לאתרי עסקים. הגדל מכירות ואסוף לידים באופן אוטומטי.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${heebo.variable} font-sans antialiased`} suppressHydrationWarning>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
