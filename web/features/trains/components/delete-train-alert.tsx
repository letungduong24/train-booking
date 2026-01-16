"use client"

import * as React from "react"
import { toast } from "sonner"
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
import { useDeleteTrain } from "@/features/trains/hooks/use-trains"
import { Train } from "@/lib/schemas/train.schema"

interface DeleteTrainAlertProps {
    train: Train
}

export function DeleteTrainAlert({ train }: DeleteTrainAlertProps) {
    const [open, setOpen] = React.useState(false)
    const deleteTrain = useDeleteTrain()

    const handleDelete = () => {
        deleteTrain.mutate(train.id, {
            onSuccess: () => {
                toast.success("Xóa tàu thành công")
                setOpen(false)
            },
            onError: () => {
                toast.error("Xóa tàu thất bại")
            }
        })
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                    <IconTrash className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Tàu <span className="font-medium text-foreground">{train.code} - {train.name}</span> sẽ bị xóa vĩnh viễn khỏi hệ thống.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {deleteTrain.isPending ? "Đang xóa..." : "Xóa"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
