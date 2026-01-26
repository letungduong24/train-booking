'use client';

import { Navbar01, type Navbar01NavLink } from '@/components/ui/shadcn-io/navbar-01';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';
import { useState, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

interface NavbarProviderProps {
    children: React.ReactNode;
}

export function NavbarProvider({ children }: NavbarProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAdmin } = useAuthStore(useShallow((state) => ({
        user: state.user,
        isAdmin: state.user?.role === 'admin',
    })));
    const logout = useAuthStore((state) => state.logout);

    // Hide navbar on admin routes
    if (pathname?.startsWith('/admin')) {
        return <div className="flex-1 flex flex-col">{children}</div>;
    }

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const guestLinks: Navbar01NavLink[] = [
        { href: '/', label: 'Trang chủ', active: pathname === '/' },
        // { href: '/about', label: 'Giới thiệu', active: pathname === '/about' },
        // { href: '/services', label: 'Dịch vụ', active: pathname === '/services' },
        { href: '/booking', label: 'Đặt vé', active: pathname === '/booking' }, // Allow guests to see booking
        { href: '/contact', label: 'Liên hệ', active: pathname === '/contact' },
    ];

    const userLinks: Navbar01NavLink[] = [
        { href: '/', label: 'Trang chủ', active: pathname === '/' },
        { href: '/dashboard', label: 'Quản lý', active: pathname === '/dashboard' },
        { href: '/booking', label: 'Đặt vé', active: pathname === '/booking' },
        { href: '/dashboard/history', label: 'Lịch sử', active: pathname?.startsWith('/dashboard/history') },
        { href: '/contact', label: 'Liên hệ', active: pathname === '/contact' },
    ];

    const adminLinks: Navbar01NavLink[] = [
        ...userLinks,
        { href: '/admin', label: 'Admin Dashboard', active: pathname?.startsWith('/admin') },
    ];

    const navigationLinks = isMounted && user
        ? (isAdmin ? adminLinks : userLinks)
        : guestLinks;

    const handleSignInClick = () => {
        if (user) {
            router.push('/dashboard/profile');
        } else {
            router.push('/login');
        }
    };

    const handleCtaClick = async () => {
        if (user) {
            // If authenticated, logout
            try {
                await logout();
                router.push('/login');
            } catch (error) {
                console.error('Logout failed:', error);
            }
        } else {
            // If not authenticated, go to register
            router.push('/register');
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            <Navbar01
                navigationLinks={navigationLinks}
                signInText={user ? user.name || user.email : 'Đăng nhập'}
                signInHref={user ? '/dashboard' : '/login'}
                ctaText={user ? 'Đăng xuất' : 'Đăng ký'}
                ctaHref={user ? '#' : '/register'}
                onSignInClick={handleSignInClick}
                onCtaClick={handleCtaClick}
            />
            <div className="flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
}
