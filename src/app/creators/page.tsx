
"use client";

import { useState, useEffect } from "react";
import { useBrand } from "@/context/BrandContext";
import { COUNTRIES, LANGUAGES } from "@/lib/constants";

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
}

const MESSAGING_PLATFORMS = ["Upwork", "Slack", "Zoho", "Whatsapp", "Instagram", "Gorgias"];
const PAYMENT_METHODS = ["Upwork", "Paypal", "Bank", "Free Kit"];
const SOURCES = ["InReach", "Instagram", "Free Kit", "Facebook", "Fiverr", "Upwork", "OutReach"];

export default function CreatorsPage() {
    const { selectedBrand } = useBrand();
    const [creators, setCreators] = useState<Creator[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCreator, setEditingCreator] = useState<Creator | null>(null);

    // Demographic Data & Selection
    const [demographics, setDemographics] = useState<Demographic[]>([]);
    const [selectedGender, setSelectedGender] = useState("");
    const [selectedAge, setSelectedAge] = useState("");

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

            const payload = { ...formData, brandId: selectedBrand.id, demographicId };

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

    const openModal = (creator?: Creator) => {
        if (creator) {
            setEditingCreator(creator);
            setFormData(creator);
            // Parse Demographic
            if (creator.demographic?.name) {
                const parts = creator.demographic.name.split(' ');
                if (parts.length >= 2) {
                    setSelectedGender(parts[0]);
                    setSelectedAge(parts[1]);
                }
            } else {
                setSelectedGender("");
                setSelectedAge("");
            }
        } else {
            setEditingCreator(null);
            setFormData({ type: 'TEMPORARY', collabCount: 0, pricePerVideo: 0, joinedAt: new Date().toISOString().split('T')[0] });
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

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Content Creators</h1>
                    <p className="text-zinc-500 mt-1">Manage your influencer relationships</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all"
                >
                    + Add Creator
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : creators.length === 0 ? (
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                    <p className="text-zinc-500 mb-4">No creators found for this brand.</p>
                    <button onClick={() => openModal()} className="text-indigo-600 hover:underline">Add your first creator</button>
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
                            {creators.map((c) => (
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
                                        {c.demographic?.name || '-'}
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
                                        <button onClick={() => openModal(c)} className="text-indigo-600 hover:text-indigo-500 mr-3">Edit</button>
                                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-500">Delete</button>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Country</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })}>
                                        <option value="">Select Country</option>
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Language</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={formData.language || ''} onChange={e => setFormData({ ...formData, language: e.target.value })}>
                                        <option value="">Select Language</option>
                                        {LANGUAGES.map(l => (
                                            <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
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
                                        {["Male", "Female"].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-500 mb-1">Age Group (Demographic)</label>
                                    <select className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-900 dark:text-white outline-none transition-all" value={selectedAge} onChange={e => setSelectedAge(e.target.value)}>
                                        <option value="">Select Age Group</option>
                                        {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(a => <option key={a} value={a}>{a}</option>)}
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

        </div>
    );
}
