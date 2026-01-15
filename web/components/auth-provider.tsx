'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth.store';

interface AuthProviderProps {
    children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const checkAuth = useAuthStore((state) => state.checkAuth);

    useEffect(() => {
        // Check authentication status only once on mount
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run once

    return <div className="flex flex-col h-screen">{children}</div>;
}
