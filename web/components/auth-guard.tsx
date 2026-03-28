'use client';

import { useAuthStore } from '@/lib/store/auth.store';
import { redirect } from 'next/navigation';
import { Loading } from './loading';
import { useShallow } from 'zustand/react/shallow';
import { VerificationRequired } from './verification-required';

interface AuthGuardProps {
    children: React.ReactNode;
    fallbackPath?: string;
    requireAdmin?: boolean;
    allowUnverified?: boolean;
}

/**
 * Auth Guard - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 * If requireAdmin is true, redirects non-admin users to /dashboard
 */
export function AuthGuard({ 
    children, 
    fallbackPath = '/login', 
    requireAdmin = false,
    allowUnverified = false 
}: AuthGuardProps) {
    const { isAuthenticated, isAdmin, isEmailVerified, isInitialized } = useAuthStore(useShallow((state) => ({
        isAuthenticated: !!state.user,
        isAdmin: state.user?.role === 'ADMIN',
        isEmailVerified: state.user?.isEmailVerified ?? false,
        isInitialized: state.isInitialized,
    })));

    if (!isInitialized) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        redirect(`${fallbackPath}?callbackUrl=${returnUrl}`);
    }

    // Redirect non-admin users trying to access admin routes
    if (requireAdmin && !isAdmin) {
        redirect('/dashboard');
    }

    // Mandatory Email Verification Guard
    // If user is authenticated but not verified, and we don't explicitly allow it (like on the home page or verification page itself)
    if (!isEmailVerified && !allowUnverified) {
        return <VerificationRequired />;
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
