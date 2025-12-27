interface LoadingSpinnerProps {
    /** Size of the spinner: 'sm' (16px), 'md' (24px), 'lg' (32px), 'xl' (48px) */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Optional text to display below the spinner */
    text?: string;
    /** Whether to center the spinner in full height */
    fullHeight?: boolean;
}

const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
};

/**
 * Reusable Loading Spinner Component
 * Use this instead of custom loading states across the app
 */
export default function LoadingSpinner({
    size = 'md',
    text,
    fullHeight = false
}: LoadingSpinnerProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${fullHeight ? 'min-h-[400px]' : 'py-8'}`}>
            <div className={`${sizeMap[size]} animate-spin`}>
                <svg
                    className="text-indigo-600 dark:text-indigo-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            </div>
            {text && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{text}</p>
            )}
        </div>
    );
}

/**
 * Page-level loading component
 * Use for full-page loading states
 */
export function PageLoader({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="xl" text={text} />
        </div>
    );
}

/**
 * Inline loading component
 * Use for buttons or small areas
 */
export function InlineLoader() {
    return <LoadingSpinner size="sm" />;
}
