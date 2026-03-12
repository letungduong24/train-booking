
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { IconPlus } from "@tabler/icons-react"
import * as turf from "@turf/turf"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createRouteSchema, CreateRouteInput } from "@/lib/schemas/route.schema"
import { useCreateRoute } from "@/features/routes/hooks/use-route-mutations"
import { InteractiveRouteBuilder } from "./interactive-route-builder"

interface CreateRouteDialogProps {
    onSuccess?: () => void;
}

export function CreateRouteDialog({ onSuccess }: CreateRouteDialogProps) {
    const [open, setOpen] = React.useState(false)
    const createRoute = useCreateRoute()

    const form = useForm({
        resolver: zodResolver(createRouteSchema),
        defaultValues: {
            name: "",
            durationMinutes: 0,
            turnaroundMinutes: 60,
            basePricePerKm: 1000,
            stationFee: 0,
            stations: [] as { id: string, name: string, latitude: number, longitude: number }[],
        },
    })

    async function onSubmit(values: CreateRouteInput) {
        createRoute.mutate(values, {
            onSuccess: () => {
                setOpen(false)
                form.reset()
                onSuccess?.()
            },
            onError: (error) => {
                // Error toast is already handled by useCreateRoute hook
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <IconPlus className="mr-2 h-4 w-4" /> Thêm tuyến
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thêm tuyến đường mới</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin chi tiết cho tuyến đường mới của bạn. Nhấn lưu để hoàn tất.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên tuyến đường</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ví dụ: Hà Nội - Sài Gòn" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Interactive Station Picker UI */}
                        <FormField
                            control={form.control}
                            name="stations"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chọn tuyến đường trên Bản đồ</FormLabel>
                                    <FormControl>
                                        <InteractiveRouteBuilder
                                            value={field.value}
                                            onChange={(stations) => {
                                                field.onChange(stations)
                                                // Auto-suggest name
                                                if (stations.length >= 2) {
                                                    const newName = `${stations[0].name} - ${stations[stations.length - 1].name}`;
                                                    const currentName = form.getValues('name');
                                                    // Only auto-update if it's empty or it looks like a previously auto-generated name
                                                    if (!currentName || currentName.includes(' - ')) {
                                                        form.setValue('name', newName, { shouldValidate: true });
                                                    }
                                                } else if (stations.length < 2) {
                                                     const currentName = form.getValues('name');
                                                     if (currentName && currentName.includes(' - ')) {
                                                         form.setValue('name', '', { shouldValidate: true });
                                                     }
                                                }

                                                // Auto-estimate durationMinutes using straight-line distance at 60km/h
                                                if (stations.length >= 2) {
                                                    let totalKm = 0;
                                                    for (let i = 0; i < stations.length - 1; i++) {
                                                        const a = turf.point([stations[i].longitude, stations[i].latitude]);
                                                        const b = turf.point([stations[i + 1].longitude, stations[i + 1].latitude]);
                                                        totalKm += turf.distance(a, b, { units: 'kilometers' });
                                                    }
                                                    // Assume 60 km/h average speed as rough estimate
                                                    const estimatedMinutes = Math.round(totalKm / 60 * 60);
                                                    form.setValue('durationMinutes', estimatedMinutes)
                                                } else {
                                                    form.setValue('durationMinutes', 0)
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="durationMinutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thời gian chạy (phút) <span className="text-muted-foreground text-xs">(có thể chỉnh sửa)</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Tự động tính sau khi chọn trạm"
                                                {...field}
                                                onChange={(e) => field.onChange(+e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="turnaroundMinutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nghỉ quay đầu (phút)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="VD: 240"
                                                {...field}
                                                onChange={(e) => field.onChange(+e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="basePricePerKm"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Giá cơ bản/km (VND)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="VD: 1200"
                                                {...field}
                                                onChange={(e) => field.onChange(+e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="stationFee"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phí bến (VND)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="VD: 10000"
                                                {...field}
                                                onChange={(e) => field.onChange(+e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={createRoute.isPending}>
                                {createRoute.isPending ? "Đang tạo…" : "Tạo tuyến"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
