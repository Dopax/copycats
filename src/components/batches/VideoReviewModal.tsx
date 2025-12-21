"use client";

import { useState, useRef, useEffect } from "react";

interface Comment {
    id: string;
    text: string;
    timestamp: number;
    userName?: string;
    createdAt: string;
}

interface VideoReviewModalProps {
    videoUrl: string;
    batchItemId: string;
    onClose: () => void;
    onStatusChange?: (status: 'DONE' | 'PENDING', notes?: string) => void;
    brandId?: string;
}

const getPlayableUrl = (url: string, brandId?: string) => {
    if (!url) return "";

    // Google Drive Support
    // 1. /file/d/VIDEO_ID/view
    let id = "";
    const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) id = driveMatch[1];

    // 2. /open?id=VIDEO_ID
    if (!id) {
        const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) id = idMatch[1];
    }

    if (id) {
        // Use our local proxy to avoid "Download" headers and CORS issues
        return `/api/video-stream?videoId=${id}${brandId ? `&brandId=${brandId}` : ''}`;
    }

    return url;
};

export default function VideoReviewModal({ videoUrl, batchItemId, onClose, onStatusChange, brandId }: VideoReviewModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Comments
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        fetchComments();
    }, [batchItemId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`/api/batch-items/${batchItemId}/comments`);
            if (res.ok) {
                setComments(await res.json());
            }
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration || 0);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const seekTo = (time: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        // Pause video so user can type context without it running away? 
        // Or capture specific time.
        const timestamp = videoRef.current?.currentTime || 0;

        try {
            const res = await fetch(`/api/batch-items/${batchItemId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: newComment,
                    timestamp: timestamp,
                    userName: "User" // TODO: Real user
                })
            });

            if (res.ok) {
                const comment = await res.json();
                setComments(prev => [...prev, comment].sort((a, b) => a.timestamp - b.timestamp));
                setNewComment("");
            }
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Formatting 00:00
    const fmtTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col z-50 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
                <h2 className="text-white font-bold text-lg">Video Review</h2>
                <div className="flex gap-4 items-center">
                    {/* Actions */}
                    {onStatusChange && (
                        <div className="flex bg-zinc-800 rounded-lg p-1 mr-4">
                            <button
                                onClick={() => { onStatusChange('DONE'); onClose(); }}
                                className="px-4 py-1.5 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Approve
                            </button>
                            <div className="w-px bg-zinc-700 mx-1"></div>
                            <button
                                onClick={() => {
                                    onStatusChange('PENDING', "See timestamped comments.");
                                    onClose();
                                }}
                                className="px-4 py-1.5 rounded-md hover:bg-zinc-700 text-zinc-300 hover:text-white text-sm font-medium transition-colors"
                            >
                                Request Revision
                            </button>
                        </div>
                    )}

                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 relative bg-black flex items-center justify-center p-8">
                    <div className="relative w-full max-w-5xl aspect-video bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-zinc-800">
                        <video
                            ref={videoRef}
                            src={getPlayableUrl(videoUrl, brandId)}
                            className="w-full h-full object-contain"
                            onClick={togglePlay}
                            onTimeUpdate={handleTimeUpdate}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            controls={false}
                        />

                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-8 left-8 right-8 max-w-5xl mx-auto">
                        <div className="bg-zinc-800/80 backdrop-blur rounded-lg p-3 flex items-center gap-4">
                            <button onClick={togglePlay} className="text-white hover:text-indigo-400">
                                {isPlaying ? (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                )}
                            </button>

                            <span className="text-xs font-mono text-zinc-300 w-12">{fmtTime(currentTime)}</span>

                            <div
                                className="flex-1 h-8 relative group cursor-pointer flex items-center"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const pct = x / rect.width;
                                    seekTo(pct * duration);
                                }}
                            >
                                <div className="w-full h-1.5 bg-zinc-600 rounded-full relative overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                    />
                                </div>

                                {comments.map(c => (
                                    <div
                                        key={c.id}
                                        className="absolute w-3 h-3 rounded-full bg-yellow-400 border-2 border-black top-2.5 hover:scale-150 transition-transform"
                                        style={{ left: `${(c.timestamp / (duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
                                        title={c.text}
                                    />
                                ))}
                            </div>

                            <span className="text-xs font-mono text-zinc-500 w-12">{fmtTime(duration)}</span>
                        </div>
                    </div>
                </div>

                <div className="w-[350px] bg-zinc-900 border-l border-zinc-800 flex flex-col">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900 z-10">
                        <h3 className="text-white font-bold mb-1">Feedback</h3>
                        <p className="text-xs text-zinc-500">{comments.length} comments</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {comments.length === 0 && !isLoading && (
                            <div className="text-center py-10 text-zinc-600 text-sm">
                                <p>No comments yet.</p>
                                <p className="text-xs mt-1">Pause the video to leave a note.</p>
                            </div>
                        )}

                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                onClick={() => seekTo(comment.timestamp)}
                                className={`p-3 rounded-lg border border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 cursor-pointer transition-all group ${Math.abs(currentTime - comment.timestamp) < 1 ? 'ring-1 ring-yellow-500 border-yellow-500/50' : ''
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-yellow-500 font-mono text-xs font-bold bg-yellow-500/10 px-1.5 py-0.5 rounded">
                                        {fmtTime(comment.timestamp)}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed group-hover:text-white transition-colors">
                                    {comment.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-zinc-800 bg-zinc-900">
                        <form onSubmit={submitComment}>
                            <div className="mb-2 flex justify-between items-end">
                                <label className="text-xs font-medium text-zinc-400">Add Comment at <span className="text-indigo-400 font-mono">{fmtTime(currentTime)}</span></label>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onFocus={() => videoRef.current?.pause()}
                                    className="flex-1 bg-zinc-800 border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-zinc-600"
                                    placeholder="Type feedback..."
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 font-medium text-sm transition-colors"
                                >
                                    Post
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
