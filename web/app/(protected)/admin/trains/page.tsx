import { TrainsTable } from "@/features/trains/components/trains-table"

export default function TrainsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản lý tàu & xe</h1>
                    <p className="text-muted-foreground">Danh sách và quản lý các phương tiện (tàu/xe) trong hệ thống.</p>
                </div>
            </div>

            <TrainsTable />
        </div>
    )
}
