import { useGlobalLoader } from "@/contexts/GlobalLoaderContext";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function GlobalLoader() {
    const { isLoading } = useGlobalLoader();

    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex items-center justify-center",
                "bg-background/50 backdrop-blur-sm",
                "transition-all duration-300 ease-out",
                isLoading
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
            )}
            aria-hidden={!isLoading}
            role="progressbar"
            aria-label="Loading page"
        >
            <Spinner className="w-10 h-10 text-primary" />
        </div>
    );
}

