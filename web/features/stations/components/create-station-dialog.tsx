"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconPlus } from "@tabler/icons-react"
import { toast } from "sonner"

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
import { createStationSchema, CreateStationInput } from "@/lib/schemas/station.schema"
import { useCreateStation } from "@/features/stations/hooks/use-station-mutations"

export function CreateStationDialog() {
    const [open, setOpen] = React.useState(false)
    const createStation = useCreateStation()

    const form = useForm<CreateStationInput>({
        resolver: zodResolver(createStationSchema),
        defaultValues: {
            name: "",
            latitute: 0,
            longtitute: 0,
        },
    })

    async function onSubmit(values: CreateStationInput) {
        createStation.mutate(values, {
            onSuccess: () => {
                toast.success("Tạo trạm thành công")
                setOpen(false)
                form.reset()
            },
            onError: (error) => {
                toast.error(error.message || "Tạo trạm thất bại")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <IconPlus className="mr-2 h-4 w-4" /> Tạo trạm
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm trạm mới</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin chi tiết cho trạm mới. Nhấn lưu để hoàn tất.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên trạm</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Bến xe Mỹ Đình" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="latitute"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vĩ độ</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="21.0285"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="longtitute"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kinh độ</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="any"
                                            placeholder="105.8542"
                                            {...field}
                                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={createStation.isPending}>
                                {createStation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
