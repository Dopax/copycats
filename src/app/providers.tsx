"use client";

import { ThemeProvider } from "next-themes";
import { BrandProvider } from "@/context/BrandContext";
import { SessionProvider } from "next-auth/react";
import ErrorBoundary from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <BrandProvider>
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </BrandProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}

