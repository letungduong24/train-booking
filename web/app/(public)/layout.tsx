import { NavbarProvider } from '@/components/navbar-provider';
import { VerificationBanner } from '@/components/verification-banner';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="font-sans">
            <VerificationBanner />
            <NavbarProvider>{children}</NavbarProvider>
        </div>
    );
}
