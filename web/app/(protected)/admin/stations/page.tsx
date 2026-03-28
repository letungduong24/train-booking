import { StationsTable } from "@/features/stations/components/stations-table"

export default function StationsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Hệ thống Trạm dừng</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Quản lý mạng lưới nhà ga, vị trí địa lý và thông tin hạ tầng điểm dừng</p>
                </div>
            </div>

            <StationsTable />
        </div>
    )
}
