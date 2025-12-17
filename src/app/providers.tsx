"use client";

import { ThemeProvider } from "next-themes";

import { BrandProvider } from "@/context/BrandContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <BrandProvider>
                {children}
            </BrandProvider>
        </ThemeProvider>
    );
}
