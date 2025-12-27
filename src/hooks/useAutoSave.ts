/**
 * useAutoSave Hook
 * Provides debounced auto-save functionality with unmount flush
 * 
 * @example
 * useAutoSave(formData, (data) => saveToServer(data), 1000);
 */

import { useRef, useEffect } from 'react';

export function useAutoSave<T>(value: T, saveFn: (val: T) => void, delay = 1000) {
    const valueRef = useRef(value);
    const saveFnRef = useRef(saveFn);
    const dirty = useRef(false);
    const first = useRef(true);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Keep refs fresh
    useEffect(() => {
        valueRef.current = value;
        saveFnRef.current = saveFn;
    }, [value, saveFn]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    // Debounce logic
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }

        dirty.current = true;

        if (timer.current) clearTimeout(timer.current);

        timer.current = setTimeout(() => {
            saveFnRef.current(value);
            dirty.current = false;
        }, delay);

    }, [value, delay]);

    // Unmount Flush
    useEffect(() => {
        return () => {
            if (dirty.current) {
                saveFnRef.current(valueRef.current);
            }
        };
    }, []);
}
