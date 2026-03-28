import { NavbarProvider } from '@/components/navbar-provider';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="font-sans">
            <NavbarProvider>{children}</NavbarProvider>
        </div>
    );
}
