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
            latitude: 0,
            longitude: 0,
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
                <Button className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20 px-6 transition-all active:scale-95 hover:scale-[1.02]">
                    <IconPlus className="mr-2 h-5 w-5" /> Thêm trạm mới
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[425px] rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Thêm Trạm mới</DialogTitle>
                    <DialogDescription className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest pt-1">
                        Nhập thông tin tọa độ và định danh cho trạm dừng mới
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="px-6 space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider ml-1">Tên trạm dừng</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ví dụ: Ga Hà Nội" className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="latitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider ml-1">Vĩ độ</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    placeholder="21.0285"
                                                    className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800"
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
                                    name="longitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider ml-1">Kinh độ</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    placeholder="105.8542"
                                                    className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="p-6 pt-2">
                            <Button type="submit" disabled={createStation.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-900/20 px-6 transition-all active:scale-95 hover:scale-[1.02]">
                                {createStation.isPending ? "Đang xử lý..." : "Lưu trạm mới"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
