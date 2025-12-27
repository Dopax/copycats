import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
    title: "Brand OS",
    description: "Track and analyze ad virality",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>
                    <Shell>{children}</Shell>
                </Providers>
            </body>
        </html>
    );
}
