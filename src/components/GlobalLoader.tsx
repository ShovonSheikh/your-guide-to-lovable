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
                "bg-white/10 dark:bg-black/10", // Subtle tint
                "backdrop-blur-md",             // Premium blur
                "backdrop-saturate-150",        // Color boost

                // --- CINEMATIC FADE ANIMATION ---
                // Matches the 1200ms timer in your Context
                "transition-all duration-1000 ease-in-out",

                // Logic:
                // 1. Loading: Fully visible.
                // 2. Exiting: Fade opacity to 0 AND blur the whole screen out (blur-xl)
                //    We also scale up slightly (scale-105) so it feels like it dissipates into the air.
                isExiting
                    ? "opacity-0 scale-105 blur-2xl pointer-events-none"
                    : "opacity-100 scale-100 blur-0 pointer-events-auto"
            )}
        >
            {/* Spinner is now standalone. 
               Increased size slightly (w-12) so it doesn't look lost without the card.
            */}
            <Spinner className="w-12 h-12 text-primary drop-shadow-md" />
        </div>
    );
}