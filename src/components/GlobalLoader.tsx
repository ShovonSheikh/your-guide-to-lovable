import { useGlobalLoader } from "@/contexts/GlobalLoaderContext";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function GlobalLoader() {
    const { isLoading, isExiting } = useGlobalLoader();

    if (!isLoading && !isExiting) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex items-center justify-center",
                "bg-white/10 dark:bg-black/10",
                "backdrop-blur-md",
                "backdrop-saturate-150",
                isExiting ? "pointer-events-none" : "pointer-events-auto"
            )}
            style={{
                opacity: isExiting ? 0 : 1,
                transition: 'opacity 500ms ease-out',
                willChange: 'opacity',
            }}
        >
            <Spinner
                className="w-12 h-12 text-primary drop-shadow-md"
                style={{
                    opacity: isExiting ? 0 : 1,
                    transition: 'opacity 200ms ease-out',
                }}
            />
        </div>
    );
}
