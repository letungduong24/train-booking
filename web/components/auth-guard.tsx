'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from './loading';

interface AuthGuardProps {
    children: React.ReactNode;
    fallbackPath?: string;
    requireAdmin?: boolean;
}

/**
 * Auth Guard - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 * If requireAdmin is true, redirects non-admin users to /onboard
 */
export function AuthGuard({ children, fallbackPath = '/login', requireAdmin = false }: AuthGuardProps) {
    const user = useAuthStore((state) => state.user);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const router = useRouter();

    useEffect(() => {
        if (isInitialized && !user) {
            router.push(fallbackPath);
        } else if (isInitialized && user && requireAdmin && user.role !== 'admin') {
            // Redirect non-admin users trying to access admin routes
            router.push('/onboard');
        }
    }, [user, isInitialized, router, fallbackPath, requireAdmin]);

    // Show loading while checking auth
    if (!isInitialized) {
        return <Loading />;
    }

    // Don't render children if not authenticated
    if (!user) {
        return null;
    }

    // Don't render children if admin is required but user is not admin
    if (requireAdmin && user.role !== 'admin') {
        return null;
    }

    return <>{children}</>;
}

/**
 * Guest Guard - Protects routes that should only be accessible to guests
 * Redirects to onboard if user is already authenticated
 */
export function GuestGuard({ children, fallbackPath = '/onboard' }: AuthGuardProps) {
    const user = useAuthStore((state) => state.user);
    const isInitialized = useAuthStore((state) => state.isInitialized);
    const router = useRouter();

    useEffect(() => {
        if (isInitialized && user) {
            router.push(fallbackPath);
        }
    }, [user, isInitialized, router, fallbackPath]);

    // Show loading while checking auth
    if (!isInitialized) {
        return <Loading />;
    }

    // Don't render children if authenticated
    if (user) {
        return null;
    }

    return <>{children}</>;
}
