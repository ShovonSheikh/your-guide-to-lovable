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

    const finishLoading = useCallback(() => {
        setIsExiting(true);
        timers.current.push(setTimeout(() => {
            setIsLoading(false);
            setIsExiting(false);
        }, 600)); // 500ms animation + 100ms buffer
    }, []);

    useEffect(() => {
        clearTimers();
        setIsLoading(true);
        setIsExiting(false);

        timers.current.push(setTimeout(() => finishLoading(), 600));

        return () => clearTimers();
    }, [location.pathname]);

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
