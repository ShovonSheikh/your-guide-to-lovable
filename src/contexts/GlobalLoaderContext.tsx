import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { useLocation } from "react-router-dom";

interface GlobalLoaderContextType {
    isLoading: boolean;
    isExiting: boolean;
    setIsLoading: (loading: boolean) => void;
}

const GlobalLoaderContext = createContext<GlobalLoaderContextType | undefined>(undefined);

export function GlobalLoaderProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const location = useLocation();

    const timers = useRef<NodeJS.Timeout[]>([]);

    const clearTimers = () => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    };

    useEffect(() => {
        clearTimers();
        setIsLoading(true);
        setIsExiting(false);

        // Fake Data Load Simulation (Remove this if you have real data triggers)
        timers.current.push(setTimeout(() => finishLoading(), 1500));

        return () => clearTimers();
    }, [location.pathname]);

    const finishLoading = useCallback(() => {
        // 1. Wait a moment so user sees content loading (Calm Phase)
        timers.current.push(setTimeout(() => {

            // 2. Trigger the CSS Fade (This starts the 1200ms transition)
            setIsExiting(true);

            // 3. Unmount ONLY after the CSS is 100% done + 300ms safety buffer
            timers.current.push(setTimeout(() => {
                setIsLoading(false);
                setIsExiting(false);
            }, 1500)); // 1200ms animation + 300ms buffer

        }, 800)); // Reduced calm phase to feel snappier
    }, []);

    return (
        <GlobalLoaderContext.Provider value={{ isLoading, isExiting, setIsLoading }}>
            {children}
        </GlobalLoaderContext.Provider>
    );
}

export function useGlobalLoader() {
    const context = useContext(GlobalLoaderContext);
    if (!context) throw new Error("useGlobalLoader must be used within GlobalLoaderProvider");
    return context;
}