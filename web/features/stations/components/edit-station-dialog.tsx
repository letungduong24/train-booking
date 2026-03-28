"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconEdit } from "@tabler/icons-react"
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
import { updateStationSchema, UpdateStationInput, Station } from "@/lib/schemas/station.schema"
import { useUpdateStation } from "@/features/stations/hooks/use-station-mutations"

interface EditStationDialogProps {
    station: Station;
}

export function EditStationDialog({ station }: EditStationDialogProps) {
    const [open, setOpen] = React.useState(false)
    const updateStation = useUpdateStation()

    const form = useForm<UpdateStationInput>({
        resolver: zodResolver(updateStationSchema),
        defaultValues: {
            name: station.name,
            latitude: Number(station.latitude),
            longitude: Number(station.longitude),
        },
    })

    React.useEffect(() => {
        if (open) {
            form.reset({
                name: station.name,
                latitude: Number(station.latitude),
                longitude: Number(station.longitude),
            })
        }
    }, [station, form, open])

    async function onSubmit(values: UpdateStationInput) {
        updateStation.mutate({ id: station.id, data: values }, {
            onSuccess: () => {
                toast.success("Cập nhật trạm thành công")
                setOpen(false)
            },
            onError: (error) => {
                toast.error(error.message || "Cập nhật trạm thất bại")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <IconEdit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[425px] rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Cập nhật Trạm dừng</DialogTitle>
                    <DialogDescription className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest pt-1">
                        Sửa đổi thông tin tọa độ và định danh cho trạm {station.name}
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
                                            <Input placeholder="Ví dụ: Ga Sài Gòn" className="h-11 rounded-xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800" {...field} />
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
                            <Button type="submit" disabled={updateStation.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-900/20 px-6 transition-all active:scale-95 hover:scale-[1.02]">
                                {updateStation.isPending ? "Đang lưu..." : "Cập nhật trạm"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
