"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { IconEdit } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useUpdateTrain } from "@/features/trains/hooks/use-trains"
import { updateTrainSchema, UpdateTrainInput, Train } from "@/lib/schemas/train.schema"

interface EditTrainDialogProps {
    train: Train
}

export function EditTrainDialog({ train }: EditTrainDialogProps) {
    const [open, setOpen] = React.useState(false)
    const updateTrain = useUpdateTrain()

    const form = useForm<UpdateTrainInput>({
        resolver: zodResolver(updateTrainSchema),
        defaultValues: {
            code: train.code,
            name: train.name,
        },
    })

    React.useEffect(() => {
        if (open) {
            form.reset({
                code: train.code,
                name: train.name,
            })
        }
    }, [open, train, form])

    function onSubmit(values: UpdateTrainInput) {
        updateTrain.mutate({ id: train.id, data: values }, {
            onSuccess: () => {
                toast.success("Cập nhật thông tin tàu thành công")
                setOpen(false)
            },
            onError: (error: any) => {
                if (error.response?.status === 409) {
                    toast.error("Mã tàu đã tồn tại")
                } else {
                    toast.error("Đã có lỗi xảy ra")
                }
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <IconEdit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sửa thông tin tàu</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin mã và tên tàu.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mã tàu</FormLabel>
                                    <FormControl>
                                        <Input placeholder="SE1..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên tàu</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Thống Nhất..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={updateTrain.isPending}>
                                {updateTrain.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
