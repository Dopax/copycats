/**
 * FileUpload Component
 * Handles file uploads to Google Drive via the /api/upload endpoint
 */

'use client';

import { useState } from 'react';

interface FileUploadProps {
    batchName: string;
    type: 'video' | 'zip';
    brandId?: string;
    batchId?: string;
    variationLabel?: string;
    onUploadComplete: (url: string, name: string) => void;
}

export function FileUpload({
    batchName,
    type,
    brandId,
    batchId,
    variationLabel,
    onUploadComplete
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('batchName', batchName);
        formData.append('type', type);
        if (brandId) formData.append('brandId', brandId);
        if (batchId) formData.append('batchId', batchId);
        if (variationLabel) formData.append('variationLabel', variationLabel);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                onUploadComplete(data.webViewLink, file.name);
            } else {
                alert(`Upload failed: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert("Upload error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group w-full">
            <input
                type="file"
                accept={type === 'zip' ? ".zip,.rar,.7z" : "video/*"}
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition-all w-full
                ${uploading
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-indigo-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-700"
                }
            `}>
                {uploading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-bold">Uploading...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm font-medium">Upload {type === 'zip' ? 'Project' : 'Video'}</span>
                    </>
                )}
            </div>
        </div>
    );
}
