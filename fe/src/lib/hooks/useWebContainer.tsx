import { useEffect, useState, useCallback, useRef } from "react";
import { WebContainer } from '@webcontainer/api';

// Global singleton to prevent multiple WebContainer instances
let globalWebContainer: WebContainer | null = null;
let isBootingGlobal = false;
let bootPromise: Promise<WebContainer> | null = null;

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const initWebContainer = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            if (typeof window === 'undefined') {
                throw new Error('WebContainer can only run in browser environment');
            }
            
            if (!WebContainer.boot) {
                throw new Error('WebContainer is not supported in this environment');
            }

            if (globalWebContainer) {
                console.log('Using existing WebContainer instance');
                if (mountedRef.current) {
                    setWebcontainer(globalWebContainer);
                }
                return;
            }

            if (isBootingGlobal && bootPromise) {
                console.log('Waiting for existing WebContainer boot process');
                const instance = await bootPromise;
                if (mountedRef.current) {
                    setWebcontainer(instance);
                }
                return;
            }

            isBootingGlobal = true;
            console.log('Booting new WebContainer instance');
            
            bootPromise = WebContainer.boot();
            const webcontainerInstance = await bootPromise;
            
            globalWebContainer = webcontainerInstance;
            
            if (mountedRef.current) {
                setWebcontainer(webcontainerInstance);
                console.log('WebContainer initialized successfully');
            }

        } catch (err) {
            console.error('Failed to initialize WebContainer:', err);
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : 'Failed to initialize WebContainer');
            }
        } finally {
            isBootingGlobal = false;
            bootPromise = null;
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const resetWebContainer = useCallback(async () => {
        try {
            if (globalWebContainer) {
                await globalWebContainer.teardown();
            }
        } catch (err) {
            console.warn('Error during WebContainer teardown:', err);
        } finally {
            globalWebContainer = null;
            isBootingGlobal = false;
            bootPromise = null;
        }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        initWebContainer();
        
        return () => {
            mountedRef.current = false;
        };
    }, [initWebContainer]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (globalWebContainer) {
                globalWebContainer.teardown?.();
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, []);

    return { 
        webcontainer, 
        isLoading, 
        error,
        reinitialize: initWebContainer,
        resetWebContainer
    };
}