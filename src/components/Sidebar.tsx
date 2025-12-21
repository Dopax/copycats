import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";
import { useBrand } from "@/context/BrandContext";
import { useSession } from "next-auth/react";

const navigation = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        )
    },
    {
        name: "Feed",
        href: "/ads",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
        )
    },
    {
        name: "Swipe File",
        href: "/swipe-file",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
        )
    },
    {
        name: "Batches Pipeline",
        href: "/batches",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        )
    },
    {
        name: "Batches List",
        href: "/batches/list",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
        )
    },
    {
        name: "Facebook Ads",
        href: "/facebook-ads",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
        )
    },
    {
        name: "Concepts",
        href: "/concepts",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        )
    },
    {
        name: "Tags",
        href: "/tags",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        )
    },
    {
        name: "Creators",
        href: "/creators",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )
    },

    {
        name: "Creatives",
        href: "/creatives",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
        )
    },
    {
        name: "Brand Assets",
        href: "/brand-assets",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    },

    {
        name: "Brand Settings",
        href: "/brand-settings",
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        )
    },
];

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { selectedBrand } = useBrand();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { data: session } = useSession();

    // Filter Navigation based on Role - Robust Check
    const filteredNavigation = navigation.filter(item => {
        const role = (session?.user as any)?.role || "OWNER"; // Default to OWNER if no role/session (middleware protects anyway)

        if (role === 'OWNER') return true;

        if (role === 'VIDEO_EDITOR') {
            // Whitelist: Batches, Creatives, Dashboard, Facebook Ads
            return ["/batches", "/batches/list", "/creatives", "/dashboard", "/facebook-ads"].includes(item.href);
        }

        if (role === 'CREATIVE_STRATEGIST') {
            // Block Tags, Settings (if any icon exists?), Brand Assets, Ads Import?
            // "access anything accept tags, setting, brand assests"
            if (["/brand-assets", "/tags", "/brand-settings"].includes(item.href)) return false;
            return true;
        }

        if (role === 'CREATOR') {
            return false;
        }

        return false;
    });

    return (
        <div className={`flex h-full flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
            <div className={`flex h-16 items-center px-6 ${isCollapsed ? "justify-center px-0" : ""}`}>
                {isCollapsed ? (
                    <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">A</span>
                ) : (
                    <h1 className="text-xl font-bold text-zinc-900 dark:text-white truncate">
                        Brand OS
                    </h1>
                )}
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4">
                {filteredNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={classNames(
                                isActive
                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-white",
                                "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? item.name : ""}
                        >
                            <span className={`${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-300"}`}>
                                {item.icon}
                            </span>
                            {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-4">
                {/* Brand Switcher */}
                {selectedBrand && (
                    <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-zinc-800 text-xs flex-shrink-0 cursor-pointer hover:ring-2 ring-zinc-300"
                            style={{ backgroundColor: selectedBrand.color || "#e4e4e7" }}
                            onClick={() => router.push("/")}
                            title={`Switch from ${selectedBrand.name}`}
                        >
                            {selectedBrand.logoUrl ? <img src={selectedBrand.logoUrl} className="w-full h-full object-cover rounded-full" /> : selectedBrand.name.charAt(0)}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{selectedBrand.name}</p>
                                <button onClick={() => router.push("/")} className="text-xs text-zinc-500 hover:text-indigo-500">Switch Brand</button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center justify-center p-2 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    {isCollapsed ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    )}
                </button>

                <div className={`flex items-center ${isCollapsed ? "justify-center flex-col gap-2" : "justify-between"}`}>
                    {!isCollapsed && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            v0.1.0
                        </div>
                    )}
                    <ThemeToggle />
                    <button
                        onClick={() => {
                            // Since we use server actions or next-auth helpers, straightforward way in client component:
                            // We can use the signOut from next-auth/react if available or server action.
                            // Sidebar is "use client" so import { signOut } from "next-auth/react" is best.
                            const { signOut } = require("next-auth/react");
                            signOut({ callbackUrl: "/login" });
                        }}
                        className="text-zinc-500 hover:text-red-600 transition-colors"
                        title="Logout"
                    >
                        {isCollapsed ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        ) : (
                            <span className="text-xs font-medium">Logout</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
