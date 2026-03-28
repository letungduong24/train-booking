"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"

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
import { useCreateTrain } from "@/features/trains/hooks/use-trains"
import { createTrainSchema, CreateTrainInput } from "@/lib/schemas/train.schema"

export function CreateTrainDialog() {
    const [open, setOpen] = React.useState(false)
    const createTrain = useCreateTrain()

    const form = useForm<CreateTrainInput>({
        resolver: zodResolver(createTrainSchema) as any,
        defaultValues: {
            code: "",
            name: "",
            averageSpeedKmH: 60,
        },
    })

    function onSubmit(values: CreateTrainInput) {
        createTrain.mutate(values, {
            onSuccess: () => {
                toast.success("Tạo tàu mới thành công")
                setOpen(false)
                form.reset()
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
                <Button className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold border-none shadow-lg shadow-rose-900/20 px-6 transition-all active:scale-95 hover:scale-[1.02]">
                    <Plus className="mr-2 h-5 w-5" /> Thêm tàu mới
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Thêm tàu mới</DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Nhập thông tin cho tàu mới. Mã tàu phải là duy nhất.
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
                                        <Input placeholder="SE1, TN1..." {...field} />
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
                            <Button type="submit" disabled={createTrain.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-full h-11 font-bold shadow-lg shadow-rose-900/20">
                                {createTrain.isPending ? "Đang tạo..." : "Tạo tàu"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
