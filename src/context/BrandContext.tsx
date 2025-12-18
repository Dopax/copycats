"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface Brand {
    id: string;
    name: string;
    logoUrl?: string | null;
    color?: string | null;
}

interface BrandContextType {
    selectedBrand: Brand | null;
    setSelectedBrand: (brand: Brand | null) => void;
    isLoading: boolean;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initBrand = async () => {
            const stored = localStorage.getItem("selectedBrand");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    const res = await fetch(`/api/brands/${parsed.id}`);
                    if (res.ok) {
                        setSelectedBrand(parsed);
                    } else {
                        localStorage.removeItem("selectedBrand");
                    }
                } catch (e) {
                    localStorage.removeItem("selectedBrand");
                }
            } else {
                // Explicitly ensure null if nothing stored
                setSelectedBrand(null);
            }
            setIsLoading(false);
        };
        initBrand();
    }, []);

    const setBrand = (brand: Brand | null) => {
        setSelectedBrand(brand);
        if (brand) {
            localStorage.setItem("selectedBrand", JSON.stringify(brand));
        } else {
            localStorage.removeItem("selectedBrand");
        }
    };

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            // Strict Protection: Redirect to Home (Login) if no brand selected
            if (!selectedBrand && pathname !== '/') {
                router.push('/');
            }
        }
    }, [selectedBrand, isLoading, pathname, router]);

    return (
        <BrandContext.Provider value={{ selectedBrand, setSelectedBrand: setBrand, isLoading }}>
            {children}
        </BrandContext.Provider>
    );
}

export const useBrand = () => {
    const context = useContext(BrandContext);
    if (!context) throw new Error("useBrand must be used within a BrandProvider");
    return context;
};
