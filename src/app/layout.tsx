import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduManage - School Management System",
  description: "Modern platform to discover and manage educational institutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      

        <main className="min-h-screen bg-gray-50">
          {children}
        </main>

      
      </body>
    </html>
  );
}
