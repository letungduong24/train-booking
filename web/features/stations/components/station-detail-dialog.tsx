"use client"

import * as React from "react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Station } from "@/lib/schemas/station.schema"
import { EditStationDialog } from "./edit-station-dialog"
import { DeleteStationAlert } from "./delete-station-alert"

interface StationDetailDialogProps {
    station: Station | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    itemsOnCurrentPage: number;
    onNavigateToPreviousPage: () => void;
}

export function StationDetailDialog({
    station,
    open,
    onOpenChange,
    currentPage,
    totalItems,
    itemsPerPage,
    itemsOnCurrentPage,
    onNavigateToPreviousPage
}: StationDetailDialogProps) {
    if (!station) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Thông tin Trạm dừng</DialogTitle>
                            <DialogDescription className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest pt-1">
                                {station.name} • Cập nhật lúc {format(new Date(station.updatedAt || station.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2">
                            <EditStationDialog station={station} />
                            <DeleteStationAlert
                                station={station}
                                currentPage={currentPage}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                itemsOnCurrentPage={itemsOnCurrentPage}
                                onNavigateToPreviousPage={onNavigateToPreviousPage}
                                onSuccess={() => onOpenChange(false)}
                            />
                        </div>
                    </div>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-4">
                    <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                        <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Tên trạm dừng</div>
                        <div className="font-bold text-base text-zinc-800 dark:text-zinc-200">{station.name}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Vĩ độ</div>
                            <div className="font-bold text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">{station.latitude}</div>
                        </div>
                        <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
                            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">Kinh độ</div>
                            <div className="font-bold text-sm text-zinc-600 dark:text-zinc-400 tabular-nums">{station.longitude}</div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
