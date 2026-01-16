"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
            latitute: station.latitute,
            longtitute: station.longtitute,
        },
    })

    React.useEffect(() => {
        form.reset({
            name: station.name,
            latitute: station.latitute,
            longtitute: station.longtitute,
        })
    }, [station, form])

    async function onSubmit(values: UpdateStationInput) {
        updateStation.mutate({ id: station.id, data: values }, {
            onSuccess: () => {
                setOpen(false)
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <IconEdit className="mr-2 h-4 w-4" /> Sửa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sửa trạm</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin trạm. Nhấn lưu để hoàn tất.
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
                                            value={field.value || ""}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                                            value={field.value || ""}
                                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={updateStation.isPending}>
                                {updateStation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
