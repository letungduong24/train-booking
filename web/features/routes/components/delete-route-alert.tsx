"use client"

import * as React from "react"
import { IconTrash } from "@tabler/icons-react"

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
import { useDeleteRoute } from "@/features/routes/hooks/use-route-mutations"
import { Route } from "@/lib/schemas/route.schema"

interface DeleteRouteAlertProps {
    route: Route;
    currentPage?: number;
    totalItems?: number;
    itemsPerPage?: number;
    itemsOnCurrentPage?: number;
    onSuccess?: () => void;
    onNavigateToPreviousPage?: () => void;
}

export function DeleteRouteAlert({
    route,
    currentPage,
    totalItems,
    itemsPerPage,
    itemsOnCurrentPage,
    onSuccess,
    onNavigateToPreviousPage
}: DeleteRouteAlertProps) {
    const [open, setOpen] = React.useState(false)

    const deleteRoute = useDeleteRoute({
        onBeforeDelete: () => {
            if (currentPage && itemsOnCurrentPage) {
                const isNotFirstPage = currentPage > 1;
                const isLastItemOnPage = itemsOnCurrentPage === 1;

                if (isNotFirstPage && isLastItemOnPage) {
                    onNavigateToPreviousPage?.();
                }
            }
        }
    })

    const handleDelete = () => {
        deleteRoute.mutate(route.id, {
            onSuccess: () => {
                setOpen(false)
                onSuccess?.()
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
                        Hành động này không thể hoàn tác. Tuyến đường <strong>{route.name}</strong> và tất cả các trạm liên quan sẽ bị xóa vĩnh viễn.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteRoute.isPending}>
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteRoute.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {deleteRoute.isPending ? "Đang xóa..." : "Xóa"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
