import { useEffect, useState, useRef } from "react";
import { WebContainer } from '@webcontainer/api';

// Global variables to ensure singleton pattern
let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let isBooting = false;

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        // Prevent multiple initialization attempts
        if (hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        async function initWebContainer() {
            try {
                // If instance already exists, use it
                if (webcontainerInstance) {
                    setWebcontainer(webcontainerInstance);
                    setIsLoading(false);
                    return;
                }

                // If already booting, wait for the existing boot process
                if (bootPromise) {
                    const instance = await bootPromise;
                    setWebcontainer(instance);
                    setIsLoading(false);
                    return;
                }

                // If currently booting, wait
                if (isBooting) {
                    // Wait for the boot to complete
                    while (isBooting) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                    if (webcontainerInstance) {
                        setWebcontainer(webcontainerInstance);
                        setIsLoading(false);
                        return;
                    }
                }

                // Start the boot process
                isBooting = true;
                console.log('Booting WebContainer...');
                
                bootPromise = WebContainer.boot();
                webcontainerInstance = await bootPromise;
                
                console.log('WebContainer booted successfully');
                setWebcontainer(webcontainerInstance);
                setIsLoading(false);
                
            } catch (err) {
                console.error('Failed to boot WebContainer:', err);
                setError(err instanceof Error ? err.message : 'Failed to boot WebContainer');
                setIsLoading(false);
            } finally {
                isBooting = false;
            }
        }

        initWebContainer();

        // Cleanup function
        return () => {
            // Don't cleanup the WebContainer instance as it should be shared
            // across all components that use it
        };
    }, []);

    return { webcontainer, isLoading, error };
}

// import { useState, useEffect, useRef } from "react";
// import { WebContainer } from "@webcontainer/api";

// const globalAny = globalThis as any;

// export function useWebContainer() {
//   const [webcontainer, setWebcontainer] = useState<any>(null);

//   useEffect(() => {
//     async function main() {
//       if (!globalAny.webcontainerInstance) {
//         globalAny.webcontainerInstance = await WebContainer.boot();
//       }
//       setWebcontainer(globalAny.webcontainerInstance);
//     }
//     main();
//   }, []);

//   return webcontainer;
// }


