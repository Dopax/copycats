
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useBrand } from "@/context/BrandContext";
import { COUNTRIES, LANGUAGES, SOURCES } from "@/lib/constants";

interface Demographic { id: string; name: string; }

interface Creator {
    id: string;
    name: string;
    country?: string;
    language?: string;
    pricePerVideo?: number;
    demographic?: Demographic | null;
    collabCount: number;
    email?: string;
    phone?: string;
    source?: string;
    messagingPlatform?: string;
    paymentMethod?: string;
    type: string;
    joinedAt: string;
    profileImageUrl?: string;
    creatives?: { id: string; thumbnailUrl: string | null; driveFileId: string | null }[];
    onboardingStep?: string;
    status?: string;        // Added
    gender?: string;        // Added
    ageGroup?: string;      // Added
    activeBatchId?: number; // Added
    offerType?: string;
    offerAmount?: number;
    productLink?: string;
    couponCode?: string;
    orderNumber?: string;
}

const MESSAGING_PLATFORMS = ["Upwork", "Slack", "Zoho", "Whatsapp", "Instagram", "Gorgias"];

const PAYMENT_METHODS = ["Upwork", "Paypal", "Bank", "Free Kit"];

export default function CreatorsPage() {
    const { selectedBrand } = useBrand();
    const [creators, setCreators] = useState<Creator[]>([]);
    const [batches, setBatches] = useState<any[]>([]); // Added
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false); // New Modal
    const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [activeTab, setActiveTab] = useState<'active' | 'requests' | 'rejected'>('active'); // New Tab State

    // Demographic Data & Selection
    const [demographics, setDemographics] = useState<Demographic[]>([]);
    const [selectedGender, setSelectedGender] = useState("");
    const [selectedAge, setSelectedAge] = useState("");

    const genderOptions = useMemo(() => {
        const genders = new Set(demographics.map(d => d.name.split(' ')[0]));
        return Array.from(genders).sort();
    }, [demographics]);

    const ageOptions = useMemo(() => {
        const ages = new Set(demographics.map(d => d.name.split(' ').slice(1).join(' ')));
        return Array.from(ages).sort();
    }, [demographics]);

    // Form State
    const [formData, setFormData] = useState<Partial<Creator>>({
        type: 'TEMPORARY',
        collabCount: 0,
        pricePerVideo: 0
    });

    useEffect(() => {
        if (selectedBrand) {
            fetchCreators();
            fetchDemographics();
            fetchBatches(); // Added
        } else {
            setIsLoading(false);
        }
    }, [selectedBrand]);

    const fetchDemographics = async () => {
        try {
            const res = await fetch('/api/demographics');
            if (res.ok) setDemographics(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchBatches = async () => {
        try {
            const res = await fetch('/api/batches');
            if (res.ok) setBatches(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchCreators = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/creators?brandId=${selectedBrand?.id}`);
            if (res.ok) {
                const data = await res.json();
                setCreators(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBrand) return;

        try {
            const url = editingCreator ? `/api/creators/${editingCreator.id}` : '/api/creators';
            const method = editingCreator ? 'PUT' : 'POST';

            // Resolve Demographic ID
            const demoName = (selectedGender && selectedAge) ? `${selectedGender} ${selectedAge}` : null;
            const demographicId = demoName ? demographics.find(d => d.name === demoName)?.id : null;



            const payload = {
                ...formData,
                brandId: selectedBrand.id,
                demographicId,
                gender: selectedGender,    // Added
                ageGroup: selectedAge      // Added
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchCreators();
                closeModal();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/api/creators/${id}`, { method: 'DELETE' });
            fetchCreators();
        } catch (e) { console.error(e); }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Reject this creator?")) return;
        try {
            await fetch(`/api/creators/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'REJECTED' })
            });
            fetchCreators();
        } catch (e) { console.error(e); }
    };

    const openModal = (creator?: Creator) => {
        if (creator) {
            setEditingCreator(creator);
            setFormData(creator);

            // Prioritize Explicit Fields, then fallback to Demographic Name
            let gender = creator.gender || "";
            let age = creator.ageGroup || "";

            if (!gender && !age && creator.demographic?.name) {
                const parts = creator.demographic.name.split(' ');
                if (parts.length >= 2) {
                    gender = parts[0];
                    age = parts.slice(1).join(' ');
                }
            }
            setSelectedGender(gender);
            setSelectedAge(age);
        } else {
            setEditingCreator(null);
            setFormData({ type: 'TEMPORARY', collabCount: 0, pricePerVideo: 0, joinedAt: new Date().toISOString().split('T')[0], profileImageUrl: '' });
            setSelectedGender("");
            setSelectedAge("");
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCreator(null);
        setFormData({});
    };

    // Helper to select image from creatives
    const handleSelectImage = (url: string) => {
        setFormData(prev => ({ ...prev, profileImageUrl: url }));
    };

    // Approval Logic
    const [approvedLink, setApprovedLink] = useState<string | null>(null);

    const openApproveModal = (creator: Creator) => {
        setEditingCreator(creator);
        setFormData({
            offerType: 'FREE_KIT',
            offerAmount: 0,
            productLink: '',
            couponCode: ''
        });
        setApprovedLink(null);
        setIsApproveModalOpen(true);
    };

    const submitApproval = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCreator) return;

        try {
            const url = `/api/creators/${editingCreator.id}`;
            const payload = {
                ...formData,
                status: 'APPROVED',
                onboardingStep: 'OFFER'
            };

            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const updatedCreator = await res.json();
                fetchCreators();

                // Show Link
                if (updatedCreator.magicLinkToken) {
                    const link = `${window.location.origin}/portal?token=${updatedCreator.magicLinkToken}`;
                    setApprovedLink(link);
                } else {
                    setIsApproveModalOpen(false);
                    setEditingCreator(null);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    // ...



    const getProxiedUrl = (url?: string | null) => {
        if (!url) return null;
        if (url.includes("drive-storage")) return null; // specific fix for broken google internal links


        // Check if it's a Drive Link
        let id = "";
        const driveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch && driveMatch[1]) id = driveMatch[1];

        // Or query param id=
        if (!id) {
            const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
            if (idMatch && idMatch[1]) id = idMatch[1];
        }

        if (id) return `/api/proxy/image/${id}`;
        return url;
    };

    const getThumbnail = (creative: { thumbnailUrl: string | null; driveFileId: string | null }) => {
        if (creative.driveFileId) {
            return `/api/proxy/image/${creative.driveFileId}`;
        }
        return getProxiedUrl(creative.thumbnailUrl);
    };

    const filteredCreators = creators.filter(c => {
        if (activeTab === 'requests') return c.status === 'APPLIED';
        if (activeTab === 'rejected') return c.status === 'REJECTED';
        return c.status === 'APPROVED' || !c.status; // Default to active if approved or legacy (no status)
    });

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Content Creators</h1>
                    <p className="text-zinc-500 mt-1">Manage your influencer relationships</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 border border-zinc-200 dark:border-zinc-700">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                            title="List View"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                            title="Grid View"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </button>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        + Add Creator
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    Active Creators
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    New Requests
                    {creators.filter(c => c.status === 'APPLIED').length > 0 && (
                        <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-xs">
                            {creators.filter(c => c.status === 'APPLIED').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rejected' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                >
                    Rejected / Archive
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : filteredCreators.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                    <p className="text-zinc-500 mb-4">No {activeTab} creators found.</p>
                    {activeTab === 'active' && <button onClick={() => openModal()} className="text-indigo-600 hover:underline">Add manually</button>}
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredCreators.map((c) => {
                        const thumbnail = getProxiedUrl(c.profileImageUrl) || (c.creatives && c.creatives.length > 0 ? getThumbnail(c.creatives[0]) : null);
                        return (
                            <div key={c.id} className="group bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden cursor-pointer" onClick={() => openModal(c)}>
                                {/* Image / Cover Area */}
                                <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                                    {thumbnail ? (
                                        <img src={thumbnail} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400">
                                            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold mb-2">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm">No Content</span>
                                        </div>
                                    )}

                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                                    {/* Absolute Positioned Info */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                        <h3 className="text-lg font-bold leading-tight mb-1 truncate">{c.name}</h3>
                                        <div className="flex items-center justify-between text-xs text-zinc-300">
                                            <span className="flex items-center gap-1">
                                                {c.country && COUNTRIES.find(x => x.code === c.country)?.flag} {c.country || 'Unknown'}
                                            </span>
                                            <span>
                                                ${c.pricePerVideo || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Top Right Badges */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm
                                            ${c.type === 'PERMANENT' ? 'bg-green-500 text-white' :
                                                c.type === 'REPEAT' ? 'bg-blue-500 text-white' :
                                                    'bg-zinc-500 text-white'}`}>
                                            {c.type}
                                        </span>
                                        {/* Status Badge */}
                                        {c.activeBatchId ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm bg-purple-500 text-white">
                                                Filming Batch
                                            </span>
                                        ) : c.onboardingStep === 'OFFER' ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm bg-yellow-500 text-white">
                                                Offer Sent
                                            </span>
                                        ) : c.onboardingStep === 'ORDER' || c.onboardingStep === 'UPLOAD' ? (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm bg-indigo-500 text-white">
                                                General Filming
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm bg-zinc-400 text-white">
                                                Idle
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Stats */}
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                                    <div className="flex items-center gap-2">
                                        <span>{c.collabCount} collabs</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {activeTab === 'requests' ? (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openApproveModal(c); }}
                                                    className="bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleReject(c.id); }}
                                                    className="bg-red-900/50 text-red-400 px-2 py-1 rounded hover:bg-red-900 transition-colors ml-2"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openApproveModal(c); }}
                                                    className="text-indigo-600 hover:text-indigo-800 transition-colors text-xs font-medium mr-2"
                                                >
                                                    Send Offer
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openModal(c); }}
                                                    className="hover:text-indigo-600 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                                    className="hover:text-red-600 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase tracking-wider text-xs font-medium">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Location</th>
                                <th className="px-6 py-4">Payment & Stats</th>
                                <th className="px-6 py-4">Demographic</th>
                                <th className="px-6 py-4">Contact & Msg</th>
                                <th className="px-6 py-4">Type/Source</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {filteredCreators.map((c) => (
                                <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            {c.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        <div>{COUNTRIES.find(x => x.code === c.country)?.flag} {COUNTRIES.find(x => x.code === c.country)?.name || c.country || '-'}</div>
                                        <div className="text-xs opacity-70">{LANGUAGES.find(x => x.code === c.language)?.flag} {LANGUAGES.find(x => x.code === c.language)?.name || c.language || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-zinc-900 dark:text-white font-medium">${c.pricePerVideo || 0}</div>
                                        <div className="text-xs text-zinc-500">{c.collabCount} collabs</div>
                                        {c.paymentMethod && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{c.paymentMethod}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-[150px] truncate" title={c.demographic?.name}>
                                        {c.gender && c.ageGroup ? `${c.gender}, ${c.ageGroup}` : (c.demographic?.name || '-')}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        <div>{c.email || '-'}</div>
                                        <div className="text-xs opacity-70">{c.phone || '-'}</div>
                                        {c.messagingPlatform && <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">{c.messagingPlatform}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                                            ${c.type === 'PERMANENT' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                c.type === 'REPEAT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                                    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                            {c.type}
                                        </span>
                                        {c.source && <div className="text-xs text-zinc-500 mt-1">Via {c.source}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {activeTab === 'requests' ? (
                                            <button onClick={() => openApproveModal(c)} className="text-indigo-600 hover:text-indigo-500 font-bold">Approve</button>
                                        ) : (
                                            <>
                                                <button onClick={() => openModal(c)} className="text-indigo-600 hover:text-indigo-500 mr-3">Edit</button>
                                                <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-500">Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && closeModal()}>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-2xl w-full p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95">
                        <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">{editingCreator ? 'Edit Creator' : 'Add New Creator'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Name</label>
                                    <input required className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Type</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="TEMPORARY">Temporary</option>
                                        <option value="REPEAT">Repeat</option>
                                        <option value="PERMANENT">Permanent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Profile Image Section */}
                            <div>
                                <label className="block text-sm text-zinc-500 mb-2">Profile Image</label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <input
                                            className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all mb-2"
                                            value={formData.profileImageUrl || ''}
                                            onChange={e => setFormData({ ...formData, profileImageUrl: e.target.value })}
                                            placeholder="Paste image URL here..."
                                        />

                                        {/* Creative Thumbnails Selection */}
                                        {editingCreator && editingCreator.creatives && editingCreator.creatives.length > 0 && (
                                            <div className="mt-3 w-full max-w-[400px]">
                                                <p className="text-xs text-zinc-500 mb-2">Select from recent creatives:</p>
                                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                                    {editingCreator.creatives.map((creative) => {
                                                        const thumb = getThumbnail(creative);
                                                        if (!thumb) return null;
                                                        return (
                                                            <button
                                                                key={creative.id}
                                                                type="button"
                                                                onClick={() => handleSelectImage(thumb!)}
                                                                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${formData.profileImageUrl === thumb ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400'}`}
                                                            >
                                                                <img
                                                                    src={thumb!}
                                                                    className="w-full h-full object-cover"
                                                                    referrerPolicy="no-referrer"
                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                />
                                                                {/* Selected Indicator Overlay */}
                                                                {formData.profileImageUrl === thumb && (
                                                                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                                                                        <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-sm" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Preview */}
                                    <div className="w-24 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex-shrink-0 overflow-hidden relative self-start mt-8">
                                        {formData.profileImageUrl ? (
                                            <img src={getProxiedUrl(formData.profileImageUrl) || ""} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Country</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })}>
                                        <option value="">Select Country</option>
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Language</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.language || ''} onChange={e => setFormData({ ...formData, language: e.target.value })}>
                                        <option value="">Select Language</option>
                                        {LANGUAGES.map(l => (
                                            <option key={l.code} value={l.name}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Price ($)</label>
                                    <input type="number" className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.pricePerVideo || 0} onChange={e => setFormData({ ...formData, pricePerVideo: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Collabs</label>
                                    <input type="number" className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.collabCount || 0} onChange={e => setFormData({ ...formData, collabCount: parseInt(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Sign Up Date</label>
                                    <input type="date" className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.joinedAt ? new Date(formData.joinedAt).toISOString().split('T')[0] : ''} onChange={e => setFormData({ ...formData, joinedAt: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Gender (Demographic)</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={selectedGender} onChange={e => setSelectedGender(e.target.value)}>
                                        <option value="">Select Gender</option>
                                        {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Age Group (Demographic)</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={selectedAge} onChange={e => setSelectedAge(e.target.value)}>
                                        <option value="">Select Age Group</option>
                                        {ageOptions.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Email</label>
                                    <input type="email" className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Phone</label>
                                    <input type="tel" className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-500 mb-1">Source</label>
                                <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.source || ''} onChange={e => setFormData({ ...formData, source: e.target.value })}>
                                    <option value="">Select Source</option>
                                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Messaging Platform</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.messagingPlatform || ''} onChange={e => setFormData({ ...formData, messagingPlatform: e.target.value })}>
                                        <option value="">Select Platform</option>
                                        {MESSAGING_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Payment Method</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.paymentMethod || ''} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                                        <option value="">Select Method</option>
                                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Creator</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Approve Modal */}
            {isApproveModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (!approvedLink) { e.target === e.currentTarget && setIsApproveModalOpen(false) } }}>
                    <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-lg w-full p-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in zoom-in-95">
                        {approvedLink ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Offer Sent!</h2>
                                <p className="text-zinc-500 mb-6">The creator has been approved. Share this link with them to access the portal:</p>

                                <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg flex items-center gap-2 mb-6 border border-zinc-200 dark:border-zinc-700">
                                    <code className="flex-1 text-sm text-zinc-600 dark:text-zinc-300 truncate">{approvedLink}</code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(approvedLink)}
                                        className="text-indigo-600 hover:text-indigo-500 font-medium text-sm"
                                    >
                                        Copy
                                    </button>
                                </div>

                                <button onClick={() => { setIsApproveModalOpen(false); setApprovedLink(null); setEditingCreator(null); }} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Approve & Send Offer</h2>
                                <p className="text-zinc-500 text-sm mb-6">Configure the offer for {editingCreator?.name}. This will notify them to proceed.</p>

                                <form onSubmit={submitApproval} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-zinc-500 mb-1">Offer Type</label>
                                        <select
                                            className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 outline-none"
                                            value={formData.offerType || 'FREE_KIT'}
                                            onChange={e => setFormData({ ...formData, offerType: e.target.value })}
                                        >
                                            <option value="FREE_KIT">Free Product Kit</option>
                                            <option value="PAID">Paid Collaboration</option>
                                        </select>
                                    </div>

                                    {formData.offerType === 'PAID' && (
                                        <div>
                                            <label className="block text-sm text-zinc-500 mb-1">Amount ($)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 outline-none"
                                                value={formData.offerAmount || 0}
                                                onChange={e => setFormData({ ...formData, offerAmount: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm text-zinc-500 mb-1">Product Link</label>
                                        <input
                                            className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 outline-none"
                                            value={formData.productLink || ''}
                                            onChange={e => setFormData({ ...formData, productLink: e.target.value })}
                                            placeholder="https://brand.com/product"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-zinc-500 mb-1">Coupon Code</label>
                                        <input
                                            className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 outline-none"
                                            value={formData.couponCode || ''}
                                            onChange={e => setFormData({ ...formData, couponCode: e.target.value })}
                                            placeholder="CREATOR100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm text-zinc-500 mb-1">Assign to Batch (Briefing)</label>
                                        <select
                                            className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 outline-none"
                                            value={formData.activeBatchId || ''}
                                            onChange={e => setFormData({ ...formData, activeBatchId: parseInt(e.target.value) })}
                                        >
                                            <option value="">-- No Batch --</option>
                                            {batches.map(b => (
                                                <option key={b.id} value={b.id}>#{b.id} - {b.name} ({b.status})</option>
                                            ))}
                                        </select>
                                        <p className="text-[10px] text-zinc-500 mt-1">Creator will see the brief from this batch.</p>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-6">
                                        <button type="button" onClick={() => setIsApproveModalOpen(false)} className="px-4 py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Cancel</button>
                                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Send Offer</button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}

