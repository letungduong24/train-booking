import { TripsTable } from "@/features/trips/components/trips-table"

export default function TripsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Điều hành Chuyến đi</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Quản lý lịch trình khởi hành, trạng thái vận hành và thông tin hành khách</p>
                </div>
            </div>

            <TripsTable />
        </div>
    )
}
