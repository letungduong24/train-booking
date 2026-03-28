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
                <Button className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold shadow-lg shadow-rose-900/20 px-6 transition-all active:scale-95">
                    <IconPlus className="mr-2 h-5 w-5" /> Thêm tuyến mới
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:hidden flex flex-col">
                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto max-h-[90vh] bg-white dark:bg-zinc-950 text-foreground">
                    <div className="p-6 md:p-6">
                        <DialogHeader className="pb-6">
                            <DialogTitle className="text-3xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Thêm tuyến đường mới</DialogTitle>
                            <DialogDescription className="text-base font-medium text-muted-foreground/50 mt-2 italic">
                                Nhập thông tin chi tiết cho tuyến đường mới. Nhấn lưu để hoàn tất.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Tên tuyến đường</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ví dụ: Hà Nội - Sài Gòn" className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 focus-visible:border-[#802222]/30 text-lg transition-all" {...field} />
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
                                            <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Chọn lộ trình chi tiết</FormLabel>
                                            <FormControl>
                                                <div className="rounded-[1.5rem] overflow-hidden border border-gray-100 bg-white">
                                                    <InteractiveRouteBuilder
                                                        value={field.value}
                                                        onChange={(stations) => {
                                                            field.onChange(stations)
                                                            if (stations.length >= 2) {
                                                                const newName = `${stations[0].name} - ${stations[stations.length - 1].name}`;
                                                                const currentName = form.getValues('name');
                                                                if (!currentName || currentName.includes(' - ')) {
                                                                    form.setValue('name', newName, { shouldValidate: true });
                                                                }
                                                            } else if (stations.length < 2) {
                                                                const currentName = form.getValues('name');
                                                                if (currentName && currentName.includes(' - ')) {
                                                                    form.setValue('name', '', { shouldValidate: true });
                                                                }
                                                            }

                                                            if (stations.length >= 2) {
                                                                let totalKm = 0;
                                                                for (let i = 0; i < stations.length - 1; i++) {
                                                                    const a = turf.point([stations[i].longitude, stations[i].latitude]);
                                                                    const b = turf.point([stations[i + 1].longitude, stations[i + 1].latitude]);
                                                                    totalKm += turf.distance(a, b, { units: 'kilometers' });
                                                                }
                                                                const estimatedMinutes = Math.round(totalKm / 60 * 60);
                                                                form.setValue('durationMinutes', estimatedMinutes)
                                                            } else {
                                                                form.setValue('durationMinutes', 0)
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormField
                                        control={form.control}
                                        name="durationMinutes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Thời gian chạy (phút)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Tự động tính..."
                                                        className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 text-lg transition-all"
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
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Nghỉ quay đầu (phút)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="VD: 240"
                                                        className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 text-lg transition-all"
                                                        {...field}
                                                        onChange={(e) => field.onChange(+e.target.value)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormField
                                        control={form.control}
                                        name="basePricePerKm"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Giá cơ bản/km (VND)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="VD: 1200"
                                                        className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 text-lg transition-all"
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
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Phí bến (VND)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="VD: 10000"
                                                        className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 text-lg transition-all"
                                                        {...field}
                                                        onChange={(e) => field.onChange(+e.target.value)}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="pt-10 pb-16">
                                    <Button type="submit" disabled={createRoute.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-[1.5rem] h-16 text-xl font-bold shadow-2xl shadow-rose-900/30 transition-all hover:scale-[1.01] active:scale-[0.98] ring-offset-2 hover:ring-2 hover:ring-rose-500/20">
                                        {createRoute.isPending ? "Đang xử lý hồ sơ…" : "Tạo tuyến mới ngay"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
