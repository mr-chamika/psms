import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import Forbidden from "./forbidden";
import { AppToaster } from "@/components/providers/AppToaster";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: "Photography Studio Management System",
  description: "An industrial project lead by Mrs.Thilini Lakshika",
};

export const viewport = {
  width: "device-width",
  initialScale: 1.0,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const isForbidden = headerList.get('x-forbidden') === 'true';

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AppToaster />
        {isForbidden ? <Forbidden /> : children}
      </body>
    </html>
  );
}
