import { useState, useEffect, useRef } from "react";

export interface SearchableOption {
    id: string;
    name: string;
    category?: string;
    description?: string;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    onAdd?: () => void;
    className?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select...",
    onAdd,
    className = ""
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filteredOptions, setFilteredOptions] = useState<SearchableOption[]>(options);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial search logic
    useEffect(() => {
        if (!search) {
            setFilteredOptions(options);
            return;
        }

        const lowerSearch = search.toLowerCase();
        const filtered = options.filter(opt =>
            opt.name.toLowerCase().includes(lowerSearch) ||
            opt.category?.toLowerCase().includes(lowerSearch) ||
            opt.description?.toLowerCase().includes(lowerSearch)
        );
        setFilteredOptions(filtered);
    }, [search, options]);

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset search if no value selected, or keep selection names? 
                // Usually better to just close. The user can see the selected value rendering.
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: SearchableOption) => {
        onChange(option.id);
        setIsOpen(false);
        setSearch("");
    };

    const selectedOption = options.find(o => o.id === value);

    return (
        <div ref={containerRef} className={`relative flex gap-2 ${className}`}>
            <div className="relative flex-1 min-w-0">
                <div
                    onClick={() => {
                        setIsOpen(!isOpen);
                        // If opening, maybe clear search or set it to current name?
                        // Let's keep it clean for fuzzy search.
                        if (!isOpen) setSearch("");
                    }}
                    className={`
                        w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 
                        rounded-lg p-2 text-sm cursor-pointer flex items-center justify-between
                        hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors
                        ${isOpen ? 'ring-2 ring-indigo-500 border-transparent' : ''}
                    `}
                >
                    <span className={`block truncate ${!selectedOption ? 'text-zinc-500' : 'text-zinc-900 dark:text-zinc-200'}`}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>

                {isOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto flex flex-col">
                        <div className="p-2 sticky top-0 bg-white dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-700">
                            <input
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="Type to search..."
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="py-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(option => (
                                    <div
                                        key={option.id}
                                        onClick={() => handleSelect(option)}
                                        className={`
                                            px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700
                                            ${value === option.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}
                                        `}
                                    >
                                        <div className="font-medium">{option.name}</div>
                                        {(option.category || option.description) && (
                                            <div className="text-xs text-zinc-500 truncate">
                                                {option.category && <span className="mr-2 font-medium text-zinc-400">[{option.category}]</span>}
                                                {option.description}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-xs text-zinc-500">
                                    No results found.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {onAdd && (
                <button
                    onClick={(e) => { e.preventDefault(); onAdd(); }}
                    className="flex-shrink-0 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors dark:text-zinc-300"
                    title="Add New"
                >
                    +
                </button>
            )}
        </div>
    );
}
