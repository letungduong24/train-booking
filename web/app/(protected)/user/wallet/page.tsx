import { WalletDashboard } from "@/features/wallet/components/wallet-dashboard"
import { Separator } from "@/components/ui/separator"

export default function WalletPage() {
    return (
        <div className="flex flex-col h-full bg-background">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Ví điện tử</h2>
                        <p className="text-muted-foreground">
                            Quản lý số dư, nạp rút và lịch sử giao dịch.
                        </p>
                    </div>
                </div>
                <Separator />
                <WalletDashboard />
            </div>
        </div>
    )
}
