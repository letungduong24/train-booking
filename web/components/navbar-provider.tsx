'use client';

import { Navbar01, type Navbar01NavLink } from '@/components/ui/shadcn-io/navbar-01';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth.store';

interface NavbarProviderProps {
    children: React.ReactNode;
}

export function NavbarProvider({ children }: NavbarProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    // Hide navbar on admin routes
    if (pathname?.startsWith('/admin')) {
        return <div className="flex-1 flex flex-col">{children}</div>;
    }

    const navigationLinks: Navbar01NavLink[] = [
        { href: '/', label: 'Trang chủ', active: pathname === '/' },
        { href: '/about', label: 'Giới thiệu', active: pathname === '/about' },
        { href: '/services', label: 'Dịch vụ', active: pathname === '/services' },
        { href: '/contact', label: 'Liên hệ', active: pathname === '/contact' },
    ];

    const handleSignInClick = () => {
        if (user) {
            router.push('/onboard');
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
                signInHref={user ? '/onboard' : '/login'}
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
