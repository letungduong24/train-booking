import { NavbarProvider } from '@/components/navbar-provider';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <NavbarProvider>{children}</NavbarProvider>;
}
