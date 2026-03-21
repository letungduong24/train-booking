import { TripsTable } from "@/features/trips/components/trips-table"

export default function TripsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý chuyến đi</h1>
                    <p className="text-muted-foreground">Danh sách và quản lý các chuyến tàu trong hệ thống.</p>
                </div>
            </div>

            <TripsTable />
        </div>
    )
}
