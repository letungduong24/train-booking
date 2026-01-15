"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconEdit } from "@tabler/icons-react"
import { z } from "zod"

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
import { useUpdateRouteStation } from "@/features/routes/hooks/use-route-mutations"

const updateRouteStationSchema = z.object({
    name: z.string().min(1, "Tên trạm không được để trống"),
    latitute: z.coerce.number(),
    longtitute: z.coerce.number(),
    distanceFromStart: z.coerce.number().min(0, "Khoảng cách phải lớn hơn hoặc bằng 0"),
})

type UpdateRouteStationInput = z.infer<typeof updateRouteStationSchema>

interface EditRouteStationDialogProps {
    routeId: string
    station: any // RouteStation & { station: Station }
    onSuccess?: () => void
}

export function EditRouteStationDialog({ routeId, station, onSuccess }: EditRouteStationDialogProps) {
    const [open, setOpen] = React.useState(false)
    const updateRouteStation = useUpdateRouteStation()

    const form = useForm<UpdateRouteStationInput>({
        resolver: zodResolver(updateRouteStationSchema),
        defaultValues: {
            name: station.station.name,
            latitute: Number(station.station.latitute),
            longtitute: Number(station.station.longtitute),
            distanceFromStart: Number(station.distanceFromStart),
        },
    })

    // Reset when station changes (in case of re-use or modal re-open with different data if props change)
    React.useEffect(() => {
        if (open) {
            form.reset({
                name: station.station.name,
                latitute: Number(station.station.latitute),
                longtitute: Number(station.station.longtitute),
                distanceFromStart: Number(station.distanceFromStart),
            })
        }
    }, [open, station, form])

    async function onSubmit(values: UpdateRouteStationInput) {
        updateRouteStation.mutate({
            routeId,
            stationId: station.stationId,
            data: values
        }, {
            onSuccess: () => {
                setOpen(false)
                onSuccess?.()
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sửa thông tin trạm</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin trạm trong tuyến đường này.
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
                                        <Input placeholder="Tên trạm..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="latitute"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vĩ độ</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" {...field} />
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
                                            <Input type="number" step="any" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="distanceFromStart"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Khoảng cách từ trạm đầu (km)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={updateRouteStation.isPending}>
                                {updateRouteStation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
