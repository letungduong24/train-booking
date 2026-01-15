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
            <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <DialogTitle>Chi tiết trạm: {station.name}</DialogTitle>
                            <DialogDescription>
                                Thông tin chi tiết về trạm dừng
                            </DialogDescription>
                        </div>
                        <div className="flex gap-2 ml-4">
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

                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 border p-4 rounded-md bg-muted/20">
                        <div>
                            <span className="font-semibold">Tên trạm:</span>
                            <p className="mt-1">{station.name}</p>
                        </div>
                        <div>
                            <span className="font-semibold">Ngày tạo:</span>
                            <p className="mt-1">{format(new Date(station.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}</p>
                        </div>
                        <div>
                            <span className="font-semibold">Vĩ độ:</span>
                            <p className="mt-1">{station.latitute}</p>
                        </div>
                        <div>
                            <span className="font-semibold">Kinh độ:</span>
                            <p className="mt-1">{station.longtitute}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
