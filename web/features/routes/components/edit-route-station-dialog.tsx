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
        latitude: Number(station.station.latitude),
        longitude: Number(station.station.longitude),
        distanceFromStart: Number(station.distanceFromStart),
    }), [station.station.name, station.station.latitude, station.station.longitude, station.distanceFromStart])

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
            <DialogContent className="max-w-[425px] rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Sửa thông tin trạm</DialogTitle>
                    <DialogDescription className="text-sm font-medium text-muted-foreground/50">
                        Cập nhật thông tin trạm trong tuyến đường này.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 space-y-5">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Tên trạm</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tên trạm..." className="h-11 rounded-xl bg-gray-50/50 border-gray-100" {...field} />
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
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Vĩ độ</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" className="h-11 rounded-xl bg-gray-50/50 border-gray-100" {...field} />
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
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Kinh độ</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="any" className="h-11 rounded-xl bg-gray-50/50 border-gray-100" {...field} />
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
                                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Khoảng cách từ trạm đầu (km)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" className="h-11 rounded-xl bg-gray-50/50 border-gray-100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="py-8">
                            <Button type="submit" disabled={updateRouteStation.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-12 font-bold shadow-lg shadow-rose-900/20">
                                {updateRouteStation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
