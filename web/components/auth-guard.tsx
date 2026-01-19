'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { redirect } from 'next/navigation';
import { Loading } from './loading';
import { useShallow } from 'zustand/react/shallow';

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
    // Combine selectors to reduce re-renders (rerender-derived-state pattern)
    // Use useShallow to prevent infinite loop from object selector
    const { isAuthenticated, isAdmin, isInitialized } = useAuthStore(useShallow((state) => ({
        isAuthenticated: !!state.user,
        isAdmin: state.user?.role === 'admin',
        isInitialized: state.isInitialized,
    })));

    // Show loading while checking auth
    if (!isInitialized) {
        return <Loading />;
    }

    // Redirect if not authenticated (using Next.js redirect instead of router.push to prevent flicker)
    if (!isAuthenticated) {
        redirect(fallbackPath);
    }

    // Redirect non-admin users trying to access admin routes
    if (requireAdmin && !isAdmin) {
        redirect('/onboard');
    }

    return <>{children}</>;
}

/**
 * Guest Guard - Protects routes that should only be accessible to guests
 * Redirects to onboard if user is already authenticated
 */
export function GuestGuard({ children, fallbackPath = '/onboard' }: AuthGuardProps) {
    // Combine selectors to reduce re-renders (rerender-derived-state pattern)
    // Use useShallow to prevent infinite loop from object selector
    const { isAuthenticated, isInitialized } = useAuthStore(useShallow((state) => ({
        isAuthenticated: !!state.user,
        isInitialized: state.isInitialized,
    })));

    // Show loading while checking auth
    if (!isInitialized) {
        return <Loading />;
    }

    // Redirect if authenticated (using Next.js redirect instead of router.push to prevent flicker)
    if (isAuthenticated) {
        redirect(fallbackPath);
    }

    return <>{children}</>;
}
