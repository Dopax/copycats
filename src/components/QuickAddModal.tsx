import { useState, useEffect } from "react";
import SearchableSelect from "./SearchableSelect";
import AwarenessTooltip from "./AwarenessTooltip";

export type QuickAddType = 'formats' | 'hooks' | 'themes' | 'desires' | 'angles' | 'awareness-levels';

interface QuickAddModalProps {
    type: QuickAddType | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;

    // Dropdown lists for Angle creation dependencies
    themes?: { id: string; name: string }[];
    desires?: { id: string; name: string }[];
    demographics?: { id: string; name: string }[];
    awarenessLevels?: { id: string; name: string }[];
}

export default function QuickAddModal({
    type,
    isOpen,
    onClose,
    onSave,
    themes = [],
    desires = [],
    demographics = [],
    awarenessLevels = []
}: QuickAddModalProps) {

    // Generic Form State
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [typeField, setTypeField] = useState(""); // For Hook Type
    const [content, setContent] = useState(""); // For Hook Content
    const [audioChoice, setAudioChoice] = useState(""); // For Format
    const [brainClicks, setBrainClicks] = useState(""); // For Desire
    const [notes, setNotes] = useState(""); // For Desire

    // Angle Dependencies
    const [themeId, setThemeId] = useState("");
    const [desireId, setDesireId] = useState("");
    const [demographicId, setDemographicId] = useState("");
    const [awarenessLevelId, setAwarenessLevelId] = useState("");

    const [loading, setLoading] = useState(false);

    // Reset state when type or openness changes
    useEffect(() => {
        if (isOpen) {
            setName("");
            setDescription("");
            setCategory("");
            setTypeField("");
            setContent("");
            setAudioChoice("");
            setBrainClicks("");
            setNotes("");
            setThemeId("");
            setDesireId("");
            setDemographicId("");
            setAwarenessLevelId("");
        }
    }, [isOpen, type]);

    if (!isOpen || !type) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data: any = { name };

            if (type === 'themes') {
                data.description = description;
                data.category = category;
            } else if (type === 'hooks') {
                data.type = typeField;
                data.content = content;
            } else if (type === 'formats') {
                data.description = description;
                data.audioChoice = audioChoice;
            } else if (type === 'desires') {
                data.description = description;
                data.category = category;
                data.brainClicks = brainClicks;
                data.notes = notes;
            } else if (type === 'angles') {
                data.themeId = themeId;
                data.desireId = desireId;
                data.demographicId = demographicId;
                data.awarenessLevelId = awarenessLevelId;
            }

            await onSave(data);
            onClose();
        } catch (error) {
            console.error("Failed to save:", error);
            alert("Failed to save item.");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'formats': return "Add New Format";
            case 'hooks': return "Add New Hook";
            case 'themes': return "Add New Theme";
            case 'desires': return "Add New Desire";
            case 'angles': return "Add New Angle";
            case 'awareness-levels': return "Add New Awareness Level";
            default: return "Add Item";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">{getTitle()}</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">

                    {/* Common Name Field */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Name <span className="text-red-500">*</span></label>
                        <input
                            required
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                            placeholder="Enter name..."
                        />
                    </div>

                    {/* FORMAT Fields */}
                    {type === 'formats' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm resize-none h-20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Audio Choice</label>
                                <select
                                    value={audioChoice}
                                    onChange={e => setAudioChoice(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                                >
                                    <option value="">Select Audio...</option>
                                    <option value="Text Only">Text Only</option>
                                    <option value="Music Only">Music Only</option>
                                    <option value="Voice Over">Voice Over</option>
                                    <option value="Person Talking">Person Talking</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* HOOK Fields */}
                    {type === 'hooks' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Type</label>
                                <select
                                    value={typeField}
                                    onChange={e => setTypeField(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                                >
                                    <option value="">Select Type...</option>
                                    <option value="TEXT">Text Overlay</option>
                                    <option value="VISUAL">Visual Hook</option>
                                    <option value="AUDIO">Audio Hook</option>
                                    <option value="COMMENT">Comment Reply</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Content / Details</label>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm resize-none h-20"
                                    placeholder="Text content or description of visual..."
                                />
                            </div>
                        </>
                    )}

                    {/* THEME Fields */}
                    {type === 'themes' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                                <input
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                                    placeholder="e.g. Holidays, Nature..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm resize-none h-20"
                                />
                            </div>
                        </>
                    )}

                    {/* DESIRE Fields */}
                    {type === 'desires' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                                <input
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm resize-none h-20"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Brain Clicks</label>
                                <input
                                    value={brainClicks}
                                    onChange={e => setBrainClicks(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                                    placeholder="Why it clicks..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Notes</label>
                                <input
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                                />
                            </div>
                        </>
                    )}

                    {/* ANGLE Fields (Dependencies) */}
                    {type === 'angles' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Theme <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={themes}
                                    value={themeId}
                                    onChange={(val) => setThemeId(val || "")}
                                    placeholder="Select Theme..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Desire <span className="text-red-500">*</span></label>
                                <SearchableSelect
                                    options={desires}
                                    value={desireId}
                                    onChange={(val) => setDesireId(val || "")}
                                    placeholder="Select Desire..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Demographic <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={demographicId}
                                    onChange={e => setDemographicId(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                                >
                                    <option value="">Select Demographic...</option>
                                    {demographics.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1 flex items-center">
                                    Awareness Level <span className="text-red-500">*</span>
                                    <AwarenessTooltip />
                                </label>
                                <select
                                    required
                                    value={awarenessLevelId}
                                    onChange={e => setAwarenessLevelId(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2.5 text-sm"
                                >
                                    <option value="">Select Awareness...</option>
                                    {awarenessLevels.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                        </>
                    )}


                    <div className="pt-2 flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
