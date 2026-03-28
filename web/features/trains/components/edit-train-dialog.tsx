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
        resolver: zodResolver(updateTrainSchema) as any,
        defaultValues: {
            code: train.code,
            name: train.name,
            averageSpeedKmH: train.averageSpeedKmH || 60,
        },
    })

    React.useEffect(() => {
        if (open) {
            form.reset({
                code: train.code,
                name: train.name,
                averageSpeedKmH: train.averageSpeedKmH || 60,
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
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-0 overflow-hidden text-zinc-900 dark:text-zinc-100">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Sửa thông tin tàu</DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Cập nhật thông tin mã và tên tàu.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 pb-8 space-y-4">
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
                        <FormField
                            control={form.control}
                            name="averageSpeedKmH"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vận tốc (km/h)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ví dụ: 60" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={updateTrain.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-full h-11 font-bold shadow-lg shadow-rose-900/20">
                                {updateTrain.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
