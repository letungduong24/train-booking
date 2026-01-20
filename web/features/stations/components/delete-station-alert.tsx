"use client"

import * as React from "react"
import { IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useDeleteStation } from "@/features/stations/hooks/use-station-mutations"
import { Station } from "@/lib/schemas/station.schema"

interface DeleteStationAlertProps {
    station: Station;
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    itemsOnCurrentPage: number;
    onSuccess?: () => void;
    onNavigateToPreviousPage?: () => void;
}

export function DeleteStationAlert({
    station,
    currentPage,
    totalItems,
    itemsPerPage,
    itemsOnCurrentPage,
    onSuccess,
    onNavigateToPreviousPage
}: DeleteStationAlertProps) {
    const [open, setOpen] = React.useState(false)

    const deleteStation = useDeleteStation({
        onBeforeDelete: () => {
            const isNotFirstPage = currentPage > 1;
            const isLastItemOnPage = itemsOnCurrentPage === 1;

            if (isNotFirstPage && isLastItemOnPage) {
                onNavigateToPreviousPage?.();
            }
        }
    })

    const handleDelete = () => {
        deleteStation.mutate(station.id, {
            onSuccess: () => {
                toast.success("Xóa trạm thành công")
                setOpen(false)
                onSuccess?.()
            },
            onError: (error) => {
                toast.error(error.message || "Xóa trạm thất bại")
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <IconTrash className="mr-2 h-4 w-4" /> Xóa
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Trạm <strong>{station.name}</strong> sẽ bị xóa vĩnh viễn.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteStation.isPending}>
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteStation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteStation.isPending ? "Đang xóa..." : "Xóa"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
