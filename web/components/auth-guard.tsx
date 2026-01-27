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
 * If requireAdmin is true, redirects non-admin users to /dashboard
 */
export function AuthGuard({ children, fallbackPath = '/login', requireAdmin = false }: AuthGuardProps) {
    // Combine selectors to reduce re-renders (rerender-derived-state pattern)
    // Use useShallow to prevent infinite loop from object selector
    const { isAuthenticated, isAdmin, isInitialized } = useAuthStore(useShallow((state) => ({
        isAuthenticated: !!state.user,
        isAdmin: state.user?.role === 'ADMIN',
        isInitialized: state.isInitialized,
    })));

    // Show loading while checking auth
    if (!isInitialized) {
        return <Loading />;
    }

    // Redirect if not authenticated (using Next.js redirect instead of router.push to prevent flicker)
    if (!isAuthenticated) {
        // We can't use usePathname here because AuthGuard is a client component but redirect needs to know context? 
        // Wait, 'redirect' from next/navigation works in Client Components too but it throws an error to escape rendering.
        // To carry the return URL, we should use window.location.pathname or similar if accessible, or pass it via props?
        // Actually best to use router.push for client side to include query params easily, 
        // OR better: use usePathname hook
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        redirect(`${fallbackPath}?callbackUrl=${returnUrl}`);
    }

    // Redirect non-admin users trying to access admin routes
    if (requireAdmin && !isAdmin) {
        redirect('/dashboard');
    }

    return <>{children}</>;
}

/**
 * Guest Guard - Protects routes that should only be accessible to guests
 * Redirects to dashboard if user is already authenticated
 */
export function GuestGuard({ children, fallbackPath = '/dashboard' }: AuthGuardProps) {
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
