import { AuthGuard } from "@/components/auth-guard"

export default function DriverLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthGuard requireDriver={true}>
            {children}
        </AuthGuard>
    )
}
