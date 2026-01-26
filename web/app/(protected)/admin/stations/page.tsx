import { StationsTable } from "@/features/stations/components/stations-table"

export default function StationsPage() {
    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý trạm dừng</h1>
                    <p className="text-muted-foreground">Danh sách và quản lý các trạm dừng trong hệ thống.</p>
                </div>
            </div>

            <StationsTable />
        </div>
    )
}
