import { GuestGuard } from '@/components/auth-guard';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <GuestGuard>{children}</GuestGuard>;
}
