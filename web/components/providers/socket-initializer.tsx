'use client';

import { useEffect } from 'react';
import { useSocketStore } from "@/lib/store/socket.store";

export function SocketInitializer() {
    const { connect, disconnect } = useSocketStore();

    useEffect(() => {
        connect();

        // Optional: Disconnect on unmount if we want to close connection when leaving the app
        // For a SPA, we might want to keep it open, but for cleanliness let's disconnect or rely on browser closing
        // However, if we navigate away, we might want to keep it if it's a persistent layout.
        // Since it's in RootLayout, it unmounts only on hard refresh or close.
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return null; // This component handles side effects only
}
