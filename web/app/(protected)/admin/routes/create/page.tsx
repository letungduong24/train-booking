"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Save, Plus } from "lucide-react"
import * as turf from "@turf/turf"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createRouteSchema, CreateRouteInput } from "@/lib/schemas/route.schema"
import { useCreateRoute } from "@/features/routes/hooks/use-route-mutations"
import { InteractiveRouteBuilder } from "@/features/routes/components/interactive-route-builder"

export default function CreateRoutePage() {
    const router = useRouter()
    const createRoute = useCreateRoute()

    const form = useForm<CreateRouteInput>({
        resolver: zodResolver(createRouteSchema),
        defaultValues: {
            name: "",
            durationMinutes: 0,
            turnaroundMinutes: 60,
            totalDistanceKm: 0,
            basePricePerKm: 1000,
            stationFee: 0,
            stations: [],
            status: 'active',
            pathCoordinates: [],
        },
    })

    async function onSubmit(values: CreateRouteInput) {
        createRoute.mutate(values, {
            onSuccess: () => {
                toast.success("Tạo tuyến đường thành công")
                router.push('/admin/routes')
            },
        })
    }

    const handleBack = () => {
        router.push('/admin/routes')
    }

    return (
        <div className="flex flex-1 flex-col gap-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleBack}
                        className="rounded-full hover:bg-rose-50 hover:text-[#802222]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Thiết lập tuyến đường mới</h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Xây dựng lộ trình và cấu hình chi phí vận hành hệ thống</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={handleBack}
                        className="rounded-xl border-gray-200 dark:border-zinc-800 hover:bg-zinc-50 font-bold px-6"
                    >
                        Hủy bỏ
                    </Button>
                    <Button 
                        onClick={form.handleSubmit(onSubmit)}
                        className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl font-bold px-8 shadow-lg shadow-rose-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        disabled={createRoute.isPending}
                    >
                        {createRoute.isPending ? "Đang xử lý..." : "Lưu & Kích hoạt"}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Side: Route Builder (Map & Stations) */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#802222] text-white text-sm font-black">1</span>
                                    Thiết lập lộ trình
                                </h3>
                                {(form.watch('stations')?.length ?? 0) > 0 && (
                                    <span className="text-xs font-bold text-rose-500/60 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
                                        {form.watch('stations')?.length} điểm dừng đã chọn
                                    </span>
                                )}
                            </div>
                            
                            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden border-none shadow-none">
                                <FormField
                                    control={form.control as any}
                                    name="stations"
                                    render={({ field }) => (
                                        <FormItem className="space-y-0">
                                            <FormControl>
                                                <InteractiveRouteBuilder
                                                    value={field.value || []}
                                                    onChange={(stations) => {
                                                        field.onChange(stations)
                                                        const stationsValue = stations || [];
                                                        if (stationsValue.length >= 2) {
                                                            const newName = `${stationsValue[0].name} - ${stationsValue[stationsValue.length - 1].name}`;
                                                            const currentName = form.getValues('name');
                                                            if (!currentName || currentName.includes(' - ')) {
                                                                form.setValue('name', newName, { shouldValidate: true });
                                                            }
                                                        }

                                                        if (stationsValue.length >= 2) {
                                                            let totalKm = 0;
                                                            for (let i = 0; i < stationsValue.length - 1; i++) {
                                                                const a = turf.point([stationsValue[i].longitude, stationsValue[i].latitude]);
                                                                const b = turf.point([stationsValue[i + 1].longitude, stationsValue[i + 1].latitude]);
                                                                totalKm += turf.distance(a, b, { units: 'kilometers' });
                                                            }
                                                            const estimatedMinutes = Math.round(totalKm / 60 * 60);
                                                            form.setValue('durationMinutes', estimatedMinutes)
                                                            form.setValue('totalDistanceKm', totalKm)
                                                        } else {
                                                            form.setValue('durationMinutes', 0)
                                                            form.setValue('totalDistanceKm', 0)
                                                        }
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage className="p-4" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Route Config */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight flex items-center gap-3 px-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#802222] text-white text-sm font-black">2</span>
                                Thông số vận hành
                            </h3>

                            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border-none shadow-none space-y-8">
                                <div className="space-y-6">
                                    <FormField
                                        control={form.control as any}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Tên hiển thị</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="VD: Hà Nội - Hải Phòng" 
                                                        className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none focus-visible:ring-1 focus-visible:ring-rose-200 text-lg font-bold text-zinc-800" 
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control as any}
                                            name="durationMinutes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Thời gian (phút)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none focus-visible:ring-1 focus-visible:ring-rose-200 font-bold tabular-nums"
                                                            {...field}
                                                            onChange={(e) => field.onChange(+e.target.value)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="turnaroundMinutes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Nghỉ (phút)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none focus-visible:ring-1 focus-visible:ring-rose-200 font-bold tabular-nums"
                                                            {...field}
                                                            onChange={(e) => field.onChange(+e.target.value)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <FormField
                                            control={form.control as any}
                                            name="basePricePerKm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-[#802222]/50 ml-1">Đơn giá VND/km</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                className="h-14 rounded-2xl bg-rose-50/20 dark:bg-rose-900/10 border-none focus-visible:ring-1 focus-visible:ring-rose-200 text-xl font-black text-[#802222]"
                                                                {...field}
                                                                onChange={(e) => field.onChange(+e.target.value)}
                                                            />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#802222]/20 uppercase">đ/km</span>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control as any}
                                            name="stationFee"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-[#802222]/50 ml-1">Phí bến bãi (mỗi ga)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                className="h-14 rounded-2xl bg-rose-50/20 dark:bg-rose-900/10 border-none focus-visible:ring-1 focus-visible:ring-rose-200 text-xl font-black text-[#802222]"
                                                                {...field}
                                                                onChange={(e) => field.onChange(+e.target.value)}
                                                            />
                                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#802222]/20 uppercase">vnđ</span>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-4">
                                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-dashed border-blue-200/50">
                                        <p className="text-[10px] font-medium text-blue-400 italic text-center leading-relaxed">
                                            Mọi thay đổi cấu hình sẽ ảnh hưởng trực tiếp đến thuật toán tính giá vé của hệ thống.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Form>
        </div>
    )
}
