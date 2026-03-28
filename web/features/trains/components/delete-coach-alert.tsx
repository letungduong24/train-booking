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
                    className="h-8 px-4 rounded-full text-[11px] font-bold text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all"
                >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Xóa toa
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa toa</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa <span className="font-bold text-zinc-900 dark:text-zinc-100">{coach.name}</span> không?
                        Hành động này không thể hoàn tác và tất cả ghế/giường trong toa sẽ bị xóa.
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
