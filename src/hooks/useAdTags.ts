import { useState } from "react";

export interface AdFormat { id: string; name: string; }
export interface AdHook { id: string; name: string; }
export interface AdTheme { id: string; name: string; }
export interface AdAngle { id: string; name: string; }
export interface AdAwarenessLevel { id: string; name: string; }

export function useAdTags() {
    const [formats, setFormats] = useState<AdFormat[]>([]);
    const [hooks, setHooks] = useState<AdHook[]>([]);
    const [themes, setThemes] = useState<AdTheme[]>([]);
    const [angles, setAngles] = useState<AdAngle[]>([]);
    const [awarenessLevels, setAwarenessLevels] = useState<AdAwarenessLevel[]>([]);

    const [isExtractingHook, setIsExtractingHook] = useState(false);

    const loadTags = async () => {
        try {
            const [formatsRes, hooksRes, themesRes, anglesRes, awarenessRes] = await Promise.all([
                fetch('/api/formats'),
                fetch('/api/hooks'),
                fetch('/api/themes'),
                fetch('/api/angles'),
                fetch('/api/awareness-levels')
            ]);
            setFormats(await formatsRes.json());
            setHooks(await hooksRes.json());
            setThemes(await themesRes.json());
            setAngles(await anglesRes.json());
            setAwarenessLevels(await awarenessRes.json());
        } catch (e) {
            console.error("Failed to load tags", e);
        }
    };

    const createFormat = async (name: string) => {
        try {
            const res = await fetch('/api/formats', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newFormat = await res.json();
            setFormats(prev => [...prev, newFormat]);
            return newFormat;
        } catch (e) {
            console.error("Failed to create format", e);
            return null;
        }
    };

    const createHook = async (name: string) => {
        try {
            const res = await fetch('/api/hooks', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newHook = await res.json();
            setHooks(prev => [...prev, newHook]);
            return newHook;
        } catch (e) {
            console.error("Failed to create hook", e);
            return null;
        }
    };

    const extractHook = async (videoUrl: string, name: string, brandId?: string) => {
        setIsExtractingHook(true);
        try {
            const res = await fetch('/api/hooks/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoUrl,
                    name,
                    brandId
                })
            });

            if (res.ok) {
                const newHook = await res.json();
                setHooks(prev => [...prev, newHook]);
                return { success: true, hook: newHook };
            } else {
                const err = await res.json();
                return { success: false, error: err.error || 'Unknown error' };
            }
        } catch (e) {
            console.error("Failed to extract hook", e);
            return { success: false, error: "Error extracting hook" };
        } finally {
            setIsExtractingHook(false);
        }
    };

    const createTheme = async (name: string) => {
        try {
            const res = await fetch('/api/themes', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newTheme = await res.json();
            setThemes(prev => [...prev, newTheme]);
            return newTheme;
        } catch (e) {
            console.error("Failed to create theme", e);
            return null;
        }
    };

    const createAngle = async (name: string) => {
        try {
            const res = await fetch('/api/angles', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newAngle = await res.json();
            setAngles(prev => [...prev, newAngle]);
            return newAngle;
        } catch (e) {
            console.error("Failed to create angle", e);
            return null;
        }
    };

    const createAwarenessLevel = async (name: string) => {
        try {
            const res = await fetch('/api/awareness-levels', {
                method: 'POST',
                body: JSON.stringify({ name })
            });
            const newLevel = await res.json();
            setAwarenessLevels(prev => [...prev, newLevel]);
            return newLevel;
        } catch (e) {
            console.error("Failed to create awareness level", e);
            return null;
        }
    };

    return {
        formats,
        hooks,
        themes,
        angles,
        awarenessLevels,
        loadTags,
        createFormat,
        createHook,
        extractHook,
        isExtractingHook,
        createTheme,
        createAngle,
        createAwarenessLevel
    };
}
