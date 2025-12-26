import { useState, useEffect, useRef } from "react";

export interface MessagingAnalysis {
    layer1: {
        corePromise: string | any;
        problemDesire: string | any;
        mechanism: string | any;
        summary: string | any;
    };
    layer2: {
        emotionalReframe: string | any;
        objectionNeutralizer: string | any;
        timeContext: string | any;
    };
    layer3: {
        identityHook: string | any;
        weight: 'EXPLICIT' | 'IMPLIED' | 'WEAK' | 'NOT_PRESENT';
    };
    // Metadata to track completeness?
}

const EMPTY_ANALYSIS: MessagingAnalysis = {
    layer1: { corePromise: "", problemDesire: "", mechanism: "", summary: "" },
    layer2: { emotionalReframe: "", objectionNeutralizer: "", timeContext: "" },
    layer3: { identityHook: "", weight: "NOT_PRESENT" }
};

interface MessagingAnalysisToolboxProps {
    value: string | null | undefined;
    onChange?: (value: string) => void;
    readOnly?: boolean;
    className?: string;
    variant?: 'default' | 'exploded';
}

export default function MessagingAnalysisToolbox({ value, onChange, readOnly = false, className = "", variant = 'default' }: MessagingAnalysisToolboxProps) {
    const [data, setData] = useState<MessagingAnalysis>(EMPTY_ANALYSIS);
    const [isParsing, setIsParsing] = useState(true);

    useEffect(() => {
        if (!value) {
            setData(EMPTY_ANALYSIS);
            setIsParsing(false);
            return;
        }
        try {
            const parsed = JSON.parse(value);
            // Basic schema validation/migration
            const merged = {
                layer1: { ...EMPTY_ANALYSIS.layer1, ...(parsed.layer1 || {}) },
                layer2: { ...EMPTY_ANALYSIS.layer2, ...(parsed.layer2 || {}) },
                layer3: { ...EMPTY_ANALYSIS.layer3, ...(parsed.layer3 || {}) }
            };
            setData(merged);
        } catch (e) {
            // Fallback for plain text legacy data
            setData({
                ...EMPTY_ANALYSIS,
                layer1: { ...EMPTY_ANALYSIS.layer1, summary: value }
            });
        }
        setIsParsing(false);
    }, [value]);

    const handleChange = (section: keyof MessagingAnalysis, field: string, val: string | any) => {
        if (readOnly || !onChange) return;

        const newData = {
            ...data,
            [section]: {
                ...data[section],
                [field]: val
            }
        };
        setData(newData);
        onChange(JSON.stringify(newData));
    };

    if (isParsing) return null;

    // Helper for status dots
    const getStatus = (val: string | any) => {
        if (typeof val === 'object' && val.text) return val.text.trim().length > 0 ? 'filled' : 'empty';
        return val && val.trim().length > 0 ? 'filled' : 'empty';
    };

    if (variant === 'exploded') {
        const hasLayer2 = data.layer2.emotionalReframe || data.layer2.objectionNeutralizer || data.layer2.timeContext;
        const hasLayer3 = data.layer3.weight !== 'NOT_PRESENT';

        return (
            <div className="space-y-6">
                {/* 1. Main Strategy Card (Summary) */}
                <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-zinc-900 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">🎯</span>
                        <h4 className="font-bold text-zinc-900 dark:text-white">Main Strategy</h4>
                    </div>
                    <InputBlock
                        label="One-Sentence Summary"
                        prompt="A product that helps ___ get ___ without ___."
                        value={data.layer1.summary}
                        onChange={(v: string) => handleChange('layer1', 'summary', v)}
                        readOnly={true} // Always read-only in this view as requested
                        highlight
                        noLabel
                    />
                </div>

                {/* 2. Mechanics Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Core Logic */}
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                        <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Core Logic
                        </h5>
                        <div className="space-y-4">
                            <InputBlock label="Core Promise" prompt="If you ___, you will get ___." value={data.layer1.corePromise} onChange={(v: string) => handleChange('layer1', 'corePromise', v)} readOnly={readOnly} />
                            <InputBlock label="Problem / Desire" prompt="This is for people who ___." value={data.layer1.problemDesire} onChange={(v: string) => handleChange('layer1', 'problemDesire', v)} readOnly={readOnly} />
                            <InputBlock label="Mechanism" prompt="This works because ___." value={data.layer1.mechanism} onChange={(v: string) => handleChange('layer1', 'mechanism', v)} readOnly={readOnly} />
                        </div>
                    </div>

                    {/* Triggers (Only if present or editable) */}
                    {(hasLayer2 || !readOnly) && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                Psychological Triggers
                            </h5>
                            <div className="space-y-4">
                                <InputBlock label="Emotional Reframe" prompt="Instead of feeling ___, you get to feel ___." value={data.layer2.emotionalReframe} onChange={(v: string) => handleChange('layer2', 'emotionalReframe', v)} readOnly={readOnly} />
                                <InputBlock label="Objection Neutralizer" prompt="You might think ___, but actually ___." value={data.layer2.objectionNeutralizer} onChange={(v: string) => handleChange('layer2', 'objectionNeutralizer', v)} readOnly={readOnly} />
                                <InputBlock label="Time / Context" prompt="This is especially relevant when ___." value={data.layer2.timeContext} onChange={(v: string) => handleChange('layer2', 'timeContext', v)} readOnly={readOnly} />
                            </div>
                        </div>
                    )}

                    {/* Identity (Only if present or editable) */}
                    {(hasLayer3 || !readOnly) && (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                            <h5 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Identity
                            </h5>
                            {data.layer3.weight !== 'NOT_PRESENT' ? (
                                <InputBlock label="Identity Hook" prompt="This is made for people who see themselves as ___." value={data.layer3.identityHook} onChange={(v: string) => handleChange('layer3', 'identityHook', v)} readOnly={readOnly} />
                            ) : (
                                <p className="text-xs text-zinc-400 italic pl-1">No identity hook identified.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm ${className}`}>

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span className="text-xl">🧰</span> Messaging Analysis
                </h3>
                {!readOnly && (
                    <div className="text-[10px] text-zinc-400 font-mono bg-zinc-50 dark:bg-zinc-800 px-2 py-1 rounded">
                        3-Layer Rule
                    </div>
                )}
            </div>

            {/* Layer 1: Mandatory */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">1</span>
                    Core Foundation (Mandatory)
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <InputBlock
                        label="Core Promise"
                        prompt="If you ___, you will get ___."
                        value={data.layer1.corePromise}
                        onChange={(v: string) => handleChange('layer1', 'corePromise', v)}
                        readOnly={readOnly}
                        required
                    />
                    <InputBlock
                        label="Problem / Desire"
                        prompt="This is for people who ___."
                        value={data.layer1.problemDesire}
                        onChange={(v: string) => handleChange('layer1', 'problemDesire', v)}
                        readOnly={readOnly}
                        required
                    />
                    <InputBlock
                        label="Mechanism"
                        prompt="This works because ___."
                        value={data.layer1.mechanism}
                        onChange={(v: string) => handleChange('layer1', 'mechanism', v)}
                        readOnly={readOnly}
                        required
                    />
                    <div className="col-span-1 border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-4 mt-2">
                        <InputBlock
                            label="One-Sentence Summary"
                            prompt="A product that helps ___ get ___ without ___."
                            value={data.layer1.summary}
                            onChange={(v: string) => handleChange('layer1', 'summary', v)}
                            readOnly={readOnly}
                            highlight
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Layer 2: Conditional */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">2</span>
                    Conditional Triggers (If Present)
                </div>

                <div className="grid grid-cols-1 gap-4 bg-teal-50/50 dark:bg-teal-900/10 p-4 rounded-xl border border-teal-100 dark:border-teal-900/30">
                    <InputBlock
                        label="Emotional Reframe"
                        prompt="Instead of feeling ___, you get to feel ___."
                        value={data.layer2.emotionalReframe}
                        onChange={(v: string) => handleChange('layer2', 'emotionalReframe', v)}
                        readOnly={readOnly}
                    />
                    <InputBlock
                        label="Objection Neutralizer"
                        prompt="You might think ___, but actually ___."
                        value={data.layer2.objectionNeutralizer}
                        onChange={(v: string) => handleChange('layer2', 'objectionNeutralizer', v)}
                        readOnly={readOnly}
                    />
                    <InputBlock
                        label="Time / Context Trigger"
                        prompt="This is especially relevant when ___."
                        value={data.layer2.timeContext}
                        onChange={(v: string) => handleChange('layer2', 'timeContext', v)}
                        readOnly={readOnly}
                    />
                </div>
            </div>

            {/* Layer 3: Implicit */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">3</span>
                    Implicit Identity (Analyst Judgment)
                </div>

                <div className="bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Identity Hook</label>

                            {!readOnly && (
                                <div className="flex bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 p-0.5">
                                    {['NOT_PRESENT', 'WEAK', 'IMPLIED', 'EXPLICIT'].map((w) => (
                                        <button
                                            key={w}
                                            onClick={() => handleChange('layer3', 'weight', w)}
                                            className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${data.layer3.weight === w
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-700 dark:text-amber-100'
                                                : 'text-zinc-400 hover:text-zinc-600'
                                                }`}
                                        >
                                            {w.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {readOnly && data.layer3.weight !== 'NOT_PRESENT' && (
                                <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-700 dark:text-amber-100">
                                    {data.layer3.weight}
                                </div>
                            )}
                        </div>
                        {data.layer3.weight !== 'NOT_PRESENT' && (
                            <InputBlock
                                label="" // Embedded above
                                prompt="This is made for people who see themselves as ___."
                                value={data.layer3.identityHook}
                                onChange={(v: string) => handleChange('layer3', 'identityHook', v)}
                                readOnly={readOnly}
                                noLabel
                            />
                        )}
                        {data.layer3.weight === 'NOT_PRESENT' && readOnly && (
                            <div className="text-xs text-zinc-400 italic">No identity hook identified.</div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}

// Subcomponent for Inputs
function InputBlock({ label, prompt, value, onChange, readOnly, required, highlight, noLabel }: any) {
    // Value can be string (legacy/freeform) or Object { text: string, inputs: string[] }
    const isObject = value && typeof value === 'object' && Array.isArray(value.inputs);

    // Determine the inputs to show
    const currentInputs = isObject ? value.inputs : [];

    // Split prompt by "___"
    const segments = prompt.split("___");
    const numHoles = segments.length - 1;

    // Helper to update a specific hole
    const updateInput = (index: number, newVal: string) => {
        const newInputs = [...currentInputs];
        // Ensure array is big enough
        while (newInputs.length < numHoles) newInputs.push("");

        newInputs[index] = newVal;

        // Reconstruct full text
        // "Seg0" + Input0 + "Seg1" + Input1 ...
        let constructed = "";
        segments.forEach((seg: string, i: number) => {
            constructed += seg;
            if (i < numHoles) {
                constructed += (newInputs[i] || "");
            }
        });

        // Send structured data parent
        onChange({
            text: constructed,
            inputs: newInputs
        });
    };

    // Determine if filled
    let isFilled = false;
    if (isObject) {
        isFilled = value.text && value.text.trim().length > 0;
    } else {
        isFilled = value && value.trim().length > 0;
    }

    if (readOnly && !isFilled) {
        if (!required) return null;
    }

    // Example generation for tooltip
    const getExample = (lbl: string) => {
        switch (lbl) {
            case "Core Promise": return "If you use this cream, you will get glowing skin.";
            case "Problem / Desire": return "This is for people who differ from acne.";
            case "Mechanism": return "This works because it uses salicylic acid.";
            case "One-Sentence Summary": return "A product that helps teenagers get clear skin without avoiding social events.";
            case "Emotional Reframe": return "Instead of feeling ashamed, you get to feel confident.";
            case "Objection Neutralizer": return "You might think it's expensive, but actually it lasts 3 months.";
            case "Time / Context Trigger": return "This is especially relevant when you have a date coming up.";
            case "Identity Hook": return "This is made for people who see themselves as skincare enthusiasts.";
            default: return "";
        }
    };

    return (
        <div className={`relative ${highlight ? 'bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30' : ''}`}>
            {!noLabel && (
                <div className="flex items-center justify-between mb-2">
                    <label className={`group text-xs font-bold flex items-center gap-1 ${highlight ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {label}
                        {/* Tooltip */}
                        <div className="relative inline-block ml-1">
                            <span className="cursor-help text-zinc-400 opacity-50 hover:opacity-100">ⓘ</span>
                            <div className="pointer-events-none absolute bottom-full left-[-12px] mb-2 w-64 opacity-0 group-hover:opacity-100 z-50 bg-zinc-800 text-white text-[10px] p-2 rounded shadow-lg transition-opacity duration-200">
                                <strong className="block mb-1 text-zinc-300">Structure:</strong> {prompt}
                                <div className="mt-1 pt-1 border-t border-zinc-700">
                                    <span className="italic text-emerald-300">{getExample(label)}</span>
                                </div>
                                {/* Arrow */}
                                <div className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-zinc-800"></div>
                            </div>
                        </div>
                    </label>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isFilled
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : (required ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800')
                        }`}>
                        {isFilled ? 'FILLED' : (required ? 'MISSING' : 'NOT PRESENT')}
                    </span>
                </div>
            )}

            {readOnly ? (
                <div className={`text-sm leading-relaxed ${isObject ? 'text-zinc-800 dark:text-zinc-200' : (isFilled ? 'text-zinc-800 dark:text-zinc-100' : 'text-red-400 italic')}`}>
                    {isObject ? (
                        // Render reconstructed text with highlighted inputs
                        <span>
                            {segments.map((seg: string, i: number) => (
                                <span key={i}>
                                    <span className="opacity-90">{seg}</span>
                                    {i < numHoles && (
                                        <strong className="text-indigo-700 dark:text-indigo-300 border-b-2 border-indigo-100 dark:border-indigo-800 px-1 mx-0.5">
                                            {currentInputs[i] || "___"}
                                        </strong>
                                    )}
                                </span>
                            ))}
                        </span>
                    ) : (
                        isFilled ? value : "No data provided."
                    )}
                </div>
            ) : (
                <div className={`text-sm leading-8 ${highlight ? 'bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'} p-3 rounded-lg border focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow`}>
                    {segments.map((seg: string, i: number) => (
                        <span key={i} className="inline tracking-auto text-zinc-600 dark:text-zinc-400 select-none">
                            {seg}
                            {i < numHoles && (
                                <AutoResizeTextArea
                                    value={currentInputs[i] || ""}
                                    onChange={(val: string) => updateInput(i, val)}
                                    placeholder="..."
                                />
                            )}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

interface AutoResizeTextAreaProps {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    minWidth?: number;
}

function AutoResizeTextArea({ value, onChange, placeholder, minWidth = 80 }: AutoResizeTextAreaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="inline-block mx-1 bg-transparent border-b-2 border-zinc-300 dark:border-zinc-600 focus:border-indigo-500 font-bold text-zinc-900 dark:text-zinc-100 outline-none px-1 placeholder:font-normal placeholder:text-zinc-300 transition-all focus:bg-indigo-50/50 dark:focus:bg-indigo-900/20 rounded-t-sm resize-none overflow-hidden align-middle leading-normal"
            style={{
                width: `${Math.max(minWidth, Math.min(600, value.length * 9))}px`,
                minWidth: `${minWidth}px`,
                verticalAlign: 'baseline'
            }}
        />
    );
}
