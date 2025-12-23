"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { COUNTRIES, LANGUAGES, SOURCES } from "@/lib/constants";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PortalPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            const url = token ? `/api/portal/status?token=${token}` : "/api/portal/status";

            const res = await fetch(url);
            if (res.status === 401 || !res.ok) {
                // Not logged in or invalid -> Show Public Landing with Brands
                if (res.status === 401 || res.status === 404) {
                    // Check if public
                    // Actually, my API returns 200 with step='PUBLIC_APPLICATION' if unauthorized
                    // But if the token is invalid, it might return 401 (if I didn't change that part? I changed it to return PUBLIC_APPLICATION in status route)
                    // Let's rely on the JSON response.
                }
            }

            const json = await res.json();

            if (json.error) {
                console.error("Portal API Error:", json.error);
                // window.location.href = "/login"; // Disabled for debugging
                return;
            }

            setData(json);
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch status", e);
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

    // Public Access
    if (data?.step === 'PUBLIC_APPLICATION') {
        return <PublicLanding brands={data.brands} />;
    }

    if (!data) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Error loading portal.</div>;

    const { step, brand, creatorName, status } = data;

    // Pending Approval Screen
    if (status === 'APPLIED') {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center font-sans p-6">
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-900/30 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Application Under Review</h2>
                    <p className="text-zinc-400 mb-6">Thanks for applying to {brand.name}. We are reviewing your profile and will notify you via email once approved.</p>
                    <button onClick={() => window.location.reload()} className="text-sm text-zinc-500 hover:text-white">Refresh Status</button>
                    <div className="mt-8">
                        <button onClick={() => signOut({ callbackUrl: '/portal' })} className="text-xs text-zinc-600 hover:text-zinc-400">Sign Out</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
            {/* Header */}
            <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    {brand.logo ? (
                        <img src={brand.logo} className="w-8 h-8 rounded-full bg-zinc-800" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold">{brand.name?.[0]}</div>
                    )}
                    <span className="font-semibold">{brand.name} Creator Portal</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-zinc-400">Hi, {creatorName}</span>
                    <button
                        onClick={() => signOut({ callbackUrl: '/portal' })}
                        className="text-xs border border-zinc-700 hover:bg-zinc-800 px-3 py-1 rounded transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-2xl">
                    {/* Progress Bar (Only show if Approved and active) */}
                    <div className="flex items-center justify-between mb-8 px-12">
                        {['Offer', 'Order', 'Upload'].map((s, i) => {
                            const steps = ['OFFER', 'ORDER', 'UPLOAD', 'COMPLETED'];
                            const currentIndex = steps.indexOf(step);
                            const thisIndex = i;
                            const active = thisIndex <= currentIndex;

                            return (
                                <div key={s} className="flex flex-col items-center gap-2 relative">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${active ? 'bg-indigo-600 border-indigo-600' : 'bg-transparent border-zinc-700 text-zinc-500'}`}>
                                        {i + 1}
                                    </div>
                                    <span className={`text-[10px] uppercase tracking-wider ${active ? 'text-zinc-300' : 'text-zinc-600'}`}>{s}</span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Step Content */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl">
                        {step === 'OFFER' && <StepOffer data={data} refresh={fetchStatus} />}
                        {step === 'ORDER' && <StepOrder data={data} refresh={fetchStatus} />}
                        {(step === 'UPLOAD' || step === 'COMPLETED') && <StepUpload data={data} refresh={fetchStatus} />}
                    </div>
                </div>
            </main>
        </div>
    );
}

// --- Public Landing (Apply / Login) ---

function PublicLanding({ brands }: any) {
    const [mode, setMode] = useState<'LOGIN' | 'APPLY'>('APPLY');
    const [form, setForm] = useState({
        name: '',
        email: '',
        socialHandle: '',
        gender: '',
        ageGroup: '',
        country: '',
        language: '',
        source: '',
        brandId: brands[0]?.id || '',
        termsAccepted: false
    });
    const [loginEmail, setLoginEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [demographics, setDemographics] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/demographics')
            .then(res => res.json())
            .then(data => setDemographics(data))
            .catch(console.error);
    }, []);

    const genderOptions = useMemo(() => {
        const genders = new Set(demographics.map((d: any) => d.name.split(' ')[0]));
        return Array.from(genders).sort();
    }, [demographics]);

    const ageOptions = useMemo(() => {
        const ages = new Set(demographics.map((d: any) => d.name.split(' ').slice(1).join(' ')));
        return Array.from(ages).sort();
    }, [demographics]);

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/public/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Application failed");

            setSubmitted(true);
        } catch (e: any) {
            alert(e.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/portal/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Login failed");

            if (json.token) {
                window.location.href = `/portal?token=${json.token}`;
            }
        } catch (e: any) {
            alert(e.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const selectedBrand = brands.find((b: any) => b.id === form.brandId);
    const termsUrl = selectedBrand?.assets?.[0]?.url || 'https://www.davincified.com/pages/davincified-video-creation-terms';

    if (submitted) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center font-sans p-6 text-center">
                <div className="w-16 h-16 bg-green-900/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Application Received!</h2>
                <p className="text-zinc-400 max-w-md">We have received your application. Please check your email for approval status.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center font-sans p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-2xl relative overflow-hidden my-10">

                {/* Toggle */}
                <div className="flex border-b border-zinc-800 mb-6">
                    <button onClick={() => setMode('APPLY')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${mode === 'APPLY' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>Apply</button>
                    <button onClick={() => setMode('LOGIN')} className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${mode === 'LOGIN' ? 'border-indigo-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>Login</button>
                </div>

                {mode === 'APPLY' ? (
                    <form onSubmit={handleApply} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div>
                            <label className="block text-xs text-zinc-500 uppercase mb-1">Brand</label>
                            <select
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                value={form.brandId}
                                onChange={e => setForm({ ...form, brandId: e.target.value })}
                            >
                                {brands.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 uppercase mb-1">Full Name</label>
                            <input
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                                placeholder="Your Name"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 uppercase mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 uppercase mb-1">Instagram / TikTok</label>
                            <input
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                value={form.socialHandle}
                                onChange={e => setForm({ ...form, socialHandle: e.target.value })}
                                required
                                placeholder="@username"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 uppercase mb-1">Gender</label>
                                <select
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                    value={form.gender}
                                    onChange={e => setForm({ ...form, gender: e.target.value })}
                                    required
                                >
                                    <option value="">Select...</option>
                                    {genderOptions.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 uppercase mb-1">Age</label>
                                <select
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                    value={form.ageGroup}
                                    onChange={e => setForm({ ...form, ageGroup: e.target.value })}
                                    required
                                >
                                    <option value="">Select...</option>
                                    {ageOptions.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-zinc-500 uppercase mb-1">Country</label>
                                <select
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                    value={form.country}
                                    onChange={e => setForm({ ...form, country: e.target.value })}
                                    required
                                >
                                    <option value="">Select...</option>
                                    {COUNTRIES.map(c => (
                                        <option key={c.code} value={c.code}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-500 uppercase mb-1">Language</label>
                                <select
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                    value={form.language}
                                    onChange={e => setForm({ ...form, language: e.target.value })}
                                    required
                                >
                                    <option value="">Select...</option>
                                    {LANGUAGES.map(l => (
                                        <option key={l.code} value={l.name}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-zinc-500 uppercase mb-1">How did you hear about us?</label>
                            <select
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                value={form.source}
                                onChange={e => setForm({ ...form, source: e.target.value })}
                            >
                                <option value="">Select...</option>
                                {SOURCES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-start gap-3 mt-4">
                            <input
                                type="checkbox"
                                id="terms"
                                required
                                checked={form.termsAccepted}
                                onChange={e => setForm({ ...form, termsAccepted: e.target.checked })}
                                className="mt-1"
                            />
                            <label htmlFor="terms" className="text-xs text-zinc-400">
                                I agree to the <a href={termsUrl} target="_blank" className="text-indigo-400 underline">{selectedBrand?.name || 'Video Creation'} Terms</a>
                            </label>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all mt-4"
                        >
                            {loading ? 'Submitting...' : 'Apply Now'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 py-10">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-bold">Welcome Back</h3>
                            <p className="text-zinc-500 text-sm">Enter your email to access your portal.</p>
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 uppercase mb-1">Email Address</label>
                            <input
                                type="email"
                                className="w-full bg-zinc-950 border border-zinc-700 rounded p-3 focus:border-indigo-500 outline-none"
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all mt-4"
                        >
                            {loading ? 'Checking...' : 'Login'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

// --- Internal Steps ---

function StepOffer({ data, refresh }: any) {
    const [submitting, setSubmitting] = useState(false);

    // Auto-advance logic could go here if offer is simple, but UI to accept is better.
    // Offer might be Free Kit or Payment.
    const offerText = data.offer.type === 'FREE_KIT'
        ? `We'd like to send you a FREE KIT of our product (Value: $${data.offer.amount}) in exchange for a video.`
        : `We'd like to offer you $${data.offer.amount} for a video creation.`;

    const activeBatch = data.activeBatch;
    const refAd = activeBatch?.referenceAd;
    const isCopycat = activeBatch?.batchType === 'COPYCAT' && refAd;

    const handleAccept = async () => {
        setSubmitting(true);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        // Accepting moves status to ORDER
        await fetch('/api/portal/update', {
            method: 'POST',
            body: JSON.stringify({ action: 'ACCEPT_OFFER', token })
        });
        refresh();
    };

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">You Have a Filming Offer!</h2>
            <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 p-8 rounded-xl mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{data.offer.type === 'FREE_KIT' ? 'Free Product Collaboration' : 'Paid Collaboration'}</h3>
                <p className="text-zinc-300 text-lg">{offerText}</p>
            </div>

            {/* Copycat Brief Display */}
            {isCopycat && (
                <div className="text-left bg-zinc-800/50 border border-zinc-700 p-6 rounded-xl mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span>🐱</span> Creative Direction: Copycat
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Video Player */}
                        <div>
                            {refAd.videoUrl ? (
                                <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden border border-zinc-700 relative group">
                                    <video
                                        src={refAd.videoUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                        poster={refAd.thumbnailUrl}
                                    />
                                </div>
                            ) : refAd.facebookLink ? (
                                <div className="aspect-[9/16] bg-black rounded-lg flex items-center justify-center border border-zinc-700 p-4 text-center">
                                    <p className="text-zinc-400 text-sm">Video available on Facebook</p>
                                    <a href={refAd.facebookLink} target="_blank" className="mt-2 text-indigo-400 underline text-xs">View Original Ad</a>
                                </div>
                            ) : (
                                <div className="aspect-[9/16] bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-500 text-sm">
                                    No preview available
                                </div>
                            )}
                        </div>

                        {/* Analysis / Instructions */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-zinc-300 uppercase mb-1">Why It Works</h4>
                                <p className="text-zinc-400 text-sm bg-zinc-900 p-3 rounded border border-zinc-800">
                                    {refAd.whyItWorks || "No specific notes."}
                                </p>
                            </div>

                            {refAd.mainMessaging && (
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-300 uppercase mb-1">Main Messaging</h4>
                                    <p className="text-zinc-400 text-sm bg-zinc-900 p-3 rounded border border-zinc-800">
                                        {refAd.mainMessaging}
                                    </p>
                                </div>
                            )}

                            {refAd.transcript && (
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-300 uppercase mb-1">Transcript</h4>
                                    <div className="text-zinc-400 text-xs bg-zinc-900 p-3 rounded border border-zinc-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                                        {refAd.transcript}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 bg-indigo-900/20 border border-indigo-500/20 rounded text-indigo-200 text-sm">
                                <strong>Instructions:</strong> Please recreate this video style and messaging, but use your own unique voice and environment.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-4 justify-center">
                <button
                    onClick={handleAccept}
                    disabled={submitting}
                    className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                >
                    {submitting ? 'Accepting...' : 'Accept & Start Filming'}
                </button>
            </div>
        </div>
    )
}

function StepOrder({ data, refresh }: any) {
    const [orderNum, setOrderNum] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const match = data.offer?.link?.match(/https?:\/\/[^\s]+/);
    const link = match ? match[0] : (data.offer?.link || '#');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        await fetch('/api/portal/update', {
            method: 'POST',
            body: JSON.stringify({ action: 'SUBMIT_ORDER', data: { orderNumber: orderNum }, token })
        });
        refresh();
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Order Your Kit</h2>
            <p className="text-zinc-400 text-sm mb-6">Please order the product using the link below. Use the coupon code to get it for free.</p>

            <div className="bg-zinc-800 p-4 rounded mb-6 flex flex-col gap-3">
                <div>
                    <span className="text-xs text-zinc-500 uppercase">Product Link</span>
                    <a href={link} target="_blank" className="block text-indigo-400 underline truncate">{link}</a>
                </div>
                <div>
                    <span className="text-xs text-zinc-500 uppercase">Coupon Code</span>
                    <div className="text-xl font-mono text-white tracking-widest">{data.offer?.coupon || 'N/A'}</div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <label className="block text-xs text-zinc-400 mb-1">Order Number (from confirmation email)</label>
                <input
                    className="w-full bg-zinc-950 border border-zinc-700 rounded p-2 focus:border-indigo-500 outline-none mb-4"
                    placeholder="#12345"
                    value={orderNum}
                    onChange={e => setOrderNum(e.target.value)}
                    required
                />
                <button
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded transition-all"
                >
                    {submitting ? 'Submitting...' : 'Confirm Order'}
                </button>
            </form>
        </div>
    )
}

function StepUpload({ data, refresh }: any) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string, type: 'RAW' | 'TESTIMONIAL' }[]>([]);

    // Helper to upload a single file
    const uploadSingleFile = async (file: File, type: 'RAW' | 'TESTIMONIAL', token: string | null) => {
        const formData = new FormData();

        let filename = file.name;
        if (type === 'TESTIMONIAL') {
            filename = `[TESTIMONIAL] ${file.name}`;
        }

        formData.append('file', file, filename);
        if (token) formData.append('token', token);

        const res = await fetch('/api/portal/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const json = await res.json();
            throw new Error(json.error || `Upload failed for ${file.name}`);
        }

        return { name: file.name, type };
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'RAW' | 'TESTIMONIAL') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError('');

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        try {
            // Sequential upload to avoid overwhelming network/drive api
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                await uploadSingleFile(file, type, token);
                setUploadedFiles(prev => [...prev, { name: file.name, type }]);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Upload failed');
        } finally {
            setUploading(false);
            // Clear input value to allow re-uploading same file if needed (though mostly for UX reset)
            e.target.value = '';
        }
    };

    const handleFinish = async () => {
        setUploading(true);
        try {
            // Call update to move to COMPLETED
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            await fetch('/api/portal/update', {
                method: 'POST',
                body: JSON.stringify({ action: 'FINISH_UPLOAD', token })
            });
            refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    if (data.step === 'COMPLETED') {
        return (
            <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-900/30 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Upload Complete!</h2>
                <p className="text-zinc-400">Thank you for your submission. We have received your content.</p>
            </div>
        )
    }

    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Upload Your Content</h2>
            <p className="text-zinc-400 text-sm mb-8">Please upload your raw videos and a native language testimonial.</p>

            {error && (
                <div className="bg-red-900/50 text-red-200 text-sm p-3 rounded mb-6 border border-red-800">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Raw Videos - Made larger/full width to emphasize volume */}
                <div className={`col-span-1 md:col-span-2 border-2 border-dashed border-zinc-700 rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer bg-zinc-950/50 relative hover:border-indigo-500 min-h-[250px]`}>
                    <input
                        type="file"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e, 'RAW')}
                        accept="video/*,image/*"
                        disabled={uploading}
                    />
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="font-bold text-xl text-white mb-2">Upload Raw Footage</span>
                    <span className="text-zinc-400">Please upload all of the raw videos (Angles, Hooks, etc.)</span>
                    <span className="text-xs text-zinc-600 mt-2">Drag & drop multiple files supported</span>
                </div>

                {/* Testimonial */}
                <div className={`col-span-1 md:col-span-2 border-2 border-dashed border-zinc-700 rounded-xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer bg-zinc-950/50 relative hover:border-emerald-500`}>
                    <input
                        type="file"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileChange(e, 'TESTIMONIAL')}
                        accept="video/*,image/*"
                        disabled={uploading}
                    />
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                    </div>
                    <span className="font-bold text-white mb-1">Native Testimonial</span>
                    <span className="text-xs text-zinc-500">Record a short review in your language</span>
                </div>
            </div>

            {/* Uploaded List */}
            {uploadedFiles.length > 0 && (
                <div className="bg-zinc-900/50 rounded-lg p-4 mb-4 text-left">
                    <h4 className="text-sm font-bold text-zinc-400 mb-2">Uploaded Files: ({uploadedFiles.length})</h4>
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {uploadedFiles.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                                <span className={`w-2 h-2 rounded-full ${f.type === 'TESTIMONIAL' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                {f.name} <span className="text-zinc-600 text-xs ml-auto uppercase">{f.type}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {uploading && (
                <div className="bg-indigo-900/20 text-indigo-300 p-2 mb-4 rounded text-sm animate-pulse">
                    Uploading... Please do not close the tab.
                </div>
            )}

            <button
                onClick={handleFinish}
                disabled={uploading || uploadedFiles.length === 0}
                className="w-full sm:w-auto bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
                {uploading ? 'Processing...' : 'Finish & Submit'}
            </button>

            <p className="mt-8 text-xs text-zinc-600">
                Files are automatically uploaded to your project folder.
            </p>
        </div>
    )
}
