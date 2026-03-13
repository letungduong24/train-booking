import { WalletDashboard } from "@/features/wallet/components/wallet-dashboard"
import { Separator } from "@/components/ui/separator"

export default function WalletPage() {
    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Ví điện tử</h2>
                <p className="text-muted-foreground">
                    Quản lý số dư, nạp rút và lịch sử giao dịch.
                </p>
            </div>
            <Separator />
            <WalletDashboard />
        </div>
    )
}
