import { AuthGuard } from '@/components/auth-guard';
import { NavbarProvider } from '@/components/navbar-provider';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <NavbarProvider>{children}</NavbarProvider>
        </AuthGuard>
    );
}
