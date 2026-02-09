import { useGlobalLoader } from "@/contexts/GlobalLoaderContext";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function GlobalLoader() {
    const { isLoading, isExiting } = useGlobalLoader();

    // Only unmount if we are completely done loading AND animating
    if (!isLoading && !isExiting) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex items-center justify-center",

                // --- GLASS STYLING ---
                "bg-white/10 dark:bg-black/10",
                "backdrop-blur-md",
                "backdrop-saturate-150",

                // --- POINTER EVENTS ---
                isExiting ? "pointer-events-none" : "pointer-events-auto"
            )}
            style={{
                // Explicit CSS transitions for better cross-platform consistency
                // PC browsers optimize transition-all too aggressively
                opacity: isExiting ? 0 : 1,
                transform: isExiting ? 'scale(1.05)' : 'scale(1)',
                filter: isExiting ? 'blur(32px)' : 'blur(0px)',
                transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), filter 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            <Spinner
                className="w-12 h-12 text-primary drop-shadow-md"
                style={{
                    opacity: isExiting ? 0 : 1,
                    transition: 'opacity 0.8s ease-out',
                }}
            />
        </div>
    );
}