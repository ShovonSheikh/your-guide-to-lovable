import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useTransition } from "react";
import { useLocation } from "react-router-dom";

interface GlobalLoaderContextType {
    isLoading: boolean;
    showLoader: () => void;
    hideLoader: () => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const location = useLocation();

    // Show loader on route change
    useEffect(() => {
        setIsLoading(true);
        setIsExiting(false);

        // Hide after longer delay so users can see content loading behind the blur
        const timer = setTimeout(() => {
            setIsExiting(true);
            // Remove from DOM after fade animation completes
            const exitTimer = setTimeout(() => {
                setIsLoading(false);
                setIsExiting(false);
            }, 300);
            return () => clearTimeout(exitTimer);
        }, 800); // Increased delay to let users see content loading

        return () => clearTimeout(timer);
    }, [location.pathname]);

    const showLoader = useCallback(() => {
        setIsLoading(true);
        setIsExiting(false);
    }, []);

    const hideLoader = useCallback(() => {
        setIsExiting(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
            setIsExiting(false);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <GlobalLoaderContext.Provider value={{ isLoading: isLoading && !isExiting, showLoader, hideLoader }}>
            {children}
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
