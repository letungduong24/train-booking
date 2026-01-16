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
        resolver: zodResolver(createTrainSchema),
        defaultValues: {
            code: "",
            name: "",
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
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Thêm tàu
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm tàu mới</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin cho tàu mới. Mã tàu phải là duy nhất.
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
                        <DialogFooter>
                            <Button type="submit" disabled={createTrain.isPending}>
                                {createTrain.isPending ? "Đang tạo..." : "Tạo tàu"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
