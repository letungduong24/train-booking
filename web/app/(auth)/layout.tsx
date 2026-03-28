import { GuestGuard } from '@/components/auth-guard';
import { NavbarProvider } from '@/components/navbar-provider';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <NavbarProvider>
            <GuestGuard>{children}</GuestGuard>
        </NavbarProvider>
    );
}
