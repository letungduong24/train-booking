import { RoutesTable } from "@/features/routes/components/routes-table"

export default function RoutesPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Quản lý Tuyến đường</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Thiết lập lộ trình, trạm dừng và cấu hình vận hành hệ thống</p>
                </div>
            </div>

            <RoutesTable />
        </div>
    )
}
