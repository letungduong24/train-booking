"use client"

import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

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
import { useDeleteCoach } from "@/features/trains/hooks/use-coach-mutations"
import { Coach } from "@/lib/schemas/coach.schema"

interface DeleteCoachAlertProps {
    coach: Coach
}

export function DeleteCoachAlert({ coach }: DeleteCoachAlertProps) {
    const deleteCoach = useDeleteCoach()
    const [open, setOpen] = useState(false); // Added state for controlling the dialog

    const handleDelete = async () => {
        try {
            await deleteCoach.mutateAsync(coach.id);
            toast.success(`Đã xóa ${coach.name}`);
            setOpen(false);
            // Don't navigate - stay on train detail page
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Xóa toa thất bại");
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}> {/* Linked dialog state */}
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Xóa toa
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa toa</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa <strong>{coach.name}</strong> không?
                        <br />
                        <br />
                        <span className="text-destructive font-medium">
                            ⚠️ Cảnh báo: Tất cả ghế/giường trong toa này sẽ bị xóa vĩnh viễn.
                        </span>
                        <br />
                        Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteCoach.isPending}
                    >
                        {deleteCoach.isPending ? "Đang xóa..." : "Xóa toa"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
