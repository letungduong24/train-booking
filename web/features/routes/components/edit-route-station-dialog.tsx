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
import { useUpdateRouteStation } from "@/features/routes/hooks/use-route-mutations"
import { updateRouteStationSchema, type UpdateRouteStationInput } from "@/lib/schemas/route.schema"

interface EditRouteStationDialogProps {
    routeId: string
    station: any // RouteStation & { station: Station }
    onSuccess?: () => void
}

export function EditRouteStationDialog({ routeId, station, onSuccess }: EditRouteStationDialogProps) {
    const [open, setOpen] = React.useState(false)
    const updateRouteStation = useUpdateRouteStation()

    // Extract default values to useMemo with primitive dependencies (rerender-dependencies pattern)
    const defaultValues = React.useMemo(() => ({
        name: station.station.name,
        latitute: Number(station.station.latitute),
        longtitute: Number(station.station.longtitute),
        distanceFromStart: Number(station.distanceFromStart),
    }), [station.station.name, station.station.latitute, station.station.longtitute, station.distanceFromStart])

    // Fix type parameters: use UpdateRouteStationInput directly
    const form = useForm<UpdateRouteStationInput>({
        resolver: zodResolver(updateRouteStationSchema),
        defaultValues,
    })

    // Reset when station changes - removed form from dependencies to prevent re-renders
    React.useEffect(() => {
        if (open) {
            form.reset(defaultValues)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, defaultValues])

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
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Sửa thông tin trạm"
                >
                    <IconEdit className="h-4 w-4" aria-hidden="true" />
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
