import { WalletDashboard } from "@/features/wallet/components/wallet-dashboard"
import { Separator } from "@/components/ui/separator"

export default function WalletPage() {
    return (
        <div className="flex flex-1 flex-col gap-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#802222] dark:text-rose-400 mb-2">Ví điện tử</h1>
                <p className="text-muted-foreground text-base font-medium opacity-80">
                    Quản lý số dư, nạp rút và lịch sử giao dịch của bạn.
                </p>
            </div>
            <WalletDashboard />
        </div>
    )
}
