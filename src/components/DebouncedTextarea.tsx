/**
 * DebouncedTextarea Component
 * A textarea that automatically saves changes after a delay
 */

'use client';

import { useState, useEffect } from 'react';
import { useAutoSave } from '@/hooks/useAutoSave';

interface DebouncedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onCommit: (value: string) => void;
    delay?: number;
}

export function DebouncedTextarea({
    value,
    onCommit,
    delay = 1000,
    ...props
}: DebouncedTextareaProps) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useAutoSave(localValue, (val) => {
        if (val !== value) onCommit(val);
    }, delay);

    return (
        <textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            {...props}
        />
    );
}
