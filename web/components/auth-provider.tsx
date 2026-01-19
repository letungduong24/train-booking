'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    useEffect(() => {
        // Call checkAuth directly without subscribing to state (rerender-defer-reads pattern)
        // The deduplication in the store ensures this only runs once even if multiple components mount
        useAuthStore.getState().checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once

    // Use Fragment instead of wrapper div to avoid unnecessary DOM nesting
    return <div className="flex flex-col h-screen">{children}</div>;}
