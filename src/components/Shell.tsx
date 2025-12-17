"use client";

import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

export default function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isRoot = pathname === "/";

    if (isRoot) {
        return <div className="min-h-screen bg-zinc-950 text-white">{children}</div>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-black">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    );
}
