import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useLocation } from "react-router-dom";

interface GlobalLoaderContextType {
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void; // Expose this so pages can control it
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [shouldRender, setShouldRender] = useState(false); // Controls existence in DOM
    const location = useLocation();

    // We use a ref to track if we are inside the "minimum display time" window
    const minTimeRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Trigger Loader on Route Change
    useEffect(() => {
        setIsLoading(true);
        setShouldRender(true);

        // Optional: If you want to force a clear after 5 seconds just in case data hangs
        const safetyTimer = setTimeout(() => {
            handleLoadingComplete();
        }, 5000);

        return () => clearTimeout(safetyTimer);
    }, [location.pathname]);

    // 2. The Smart "Fade Out" Logic
    const handleLoadingComplete = useCallback(() => {
        // Wait for the "calm" delay (e.g., 1 second) BEFORE starting the fade
        const calmTimer = setTimeout(() => {
            setIsLoading(false); // Triggers the opacity-0 transition

            // Wait for the CSS transition (300ms) to finish before unmounting
            const removeTimer = setTimeout(() => {
                setShouldRender(false);
            }, 300); // Must match duration-300 in CSS

        }, 1000); // The "1 second wait" you asked for

        return () => {
            clearTimeout(calmTimer);
        };
    }, []);

    // 3. Manual Control (For data fetching)
    // If you want to manually turn it off after data fetch:
    // const { setIsLoading } = useGlobalLoader();
    // useEffect(() => { if(data) setIsLoading(false) }, [data]);

    // BUT, for the auto-route behavior you currently have:
    useEffect(() => {
        if (isLoading) {
            // In your current logic, you just want a fixed timer. 
            // If you want to keep it simple (Fixed Timer):
            const timer = setTimeout(() => {
                handleLoadingComplete();
            }, 800); // Minimum time the loader stays up
            return () => clearTimeout(timer);
        }
    }, [isLoading, handleLoadingComplete]);

    return (
        <GlobalLoaderContext.Provider
            value={{
                // We pass the internal logic so the UI knows to fade
                isLoading: isLoading,
                setIsLoading
            }}
        >
            {/* We only render the component if it should be there, 
                but we use CSS opacity for the visual fade */}
            {shouldRender && children}
        </GlobalLoaderContext.Provider>
    );
}

export function useGlobalLoader() {
    const context = useContext(GlobalLoaderContext);
    if (context === undefined) {
        throw new Error("useGlobalLoader must be used within a GlobalLoaderProvider");
    }
    return context;
}