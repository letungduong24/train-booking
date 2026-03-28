import { TrainsTable } from "@/features/trains/components/trains-table"

export default function TrainsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Đội tàu & Phương tiện</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Quản lý danh mục phương tiện, thông số kỹ thuật và trạng thái bảo trì</p>
                </div>
            </div>

            <TrainsTable />
        </div>
    )
}
