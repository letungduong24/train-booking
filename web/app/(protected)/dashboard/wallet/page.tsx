import { WalletDashboard } from "@/features/wallet/components/wallet-dashboard"
import { Separator } from "@/components/ui/separator"

export default function WalletPage() {
    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-primary mb-2">Ví điện tử</h1>
                <p className="text-muted-foreground text-lg">
                    Quản lý số dư, nạp rút và lịch sử giao dịch.
                </p>
            </div>
            <WalletDashboard />
        </div>
    )
}
