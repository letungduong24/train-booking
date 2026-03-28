"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowLeft, Save, MapPin, Train as TrainIcon, Calendar } from "lucide-react"

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
import { useCreateTrip } from "@/features/trips/hooks/use-trips"
import { createTripSchema, CreateTripInput } from "@/lib/schemas/trip.schema"
import { SelectRouteDialog } from "@/features/trips/components/select-route-dialog"
import { SelectTrainDialog } from "@/features/trips/components/select-train-dialog"
import { Route } from "@/lib/schemas/route.schema"
import { Train } from "@/lib/schemas/train.schema"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function CreateTripPage() {
    const router = useRouter()
    const [routeDialogOpen, setRouteDialogOpen] = React.useState(false)
    const [trainDialogOpen, setTrainDialogOpen] = React.useState(false)
    const [selectedRoute, setSelectedRoute] = React.useState<Route | null>(null)
    const [selectedTrain, setSelectedTrain] = React.useState<Train | null>(null)
    const createTrip = useCreateTrip()

    const form = useForm<CreateTripInput>({
        resolver: zodResolver(createTripSchema),
        defaultValues: {
            routeId: "",
            trainId: "",
            departureTime: "",
        },
    })

    const handleRouteSelect = (route: Route) => {
        setSelectedRoute(route)
        form.setValue("routeId", route.id)
    }

    const handleTrainSelect = (train: Train) => {
        setSelectedTrain(train)
        form.setValue("trainId", train.id)
    }

    function onSubmit(values: CreateTripInput) {
        createTrip.mutate(values, {
            onSuccess: () => {
                toast.success("Tạo chuyến đi thành công")
                router.push('/admin/trips')
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || "Đã có lỗi xảy ra")
            }
        })
    }

    return (
        <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-rose-50 hover:text-[#802222]">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Tạo chuyến đi mới</h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium italic opacity-60">Thiết lập lộ trình và thời gian vận hành cho đoàn tàu</p>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div>
                    <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-rose-900/[0.03] bg-white dark:bg-zinc-950 overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Chi tiết chuyến đi</CardTitle>
                            <CardDescription className="text-xs font-medium text-muted-foreground/50 italic">Cung cấp các thông tin cơ bản để bắt đầu hành trình</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-2">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="routeId"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Tuyến đường</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Input
                                                                value={selectedRoute?.name || ""}
                                                                placeholder="Chọn tuyến đường vận hành..."
                                                                readOnly
                                                                className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 text-lg transition-all cursor-pointer pr-24"
                                                                onClick={() => setRouteDialogOpen(true)}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => setRouteDialogOpen(true)}
                                                                className="absolute right-2 top-2 h-10 rounded-xl text-[#802222] hover:bg-rose-50 font-bold"
                                                            >
                                                                Chọn
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="trainId"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Đoàn tàu</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Input
                                                                value={selectedTrain ? `${selectedTrain.code} - ${selectedTrain.name}` : ""}
                                                                placeholder="Chọn đoàn tàu đảm nhận..."
                                                                readOnly
                                                                className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 text-lg transition-all cursor-pointer pr-24"
                                                                onClick={() => setTrainDialogOpen(true)}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => setTrainDialogOpen(true)}
                                                                className="absolute right-2 top-2 h-10 rounded-xl text-[#802222] hover:bg-rose-50 font-bold"
                                                            >
                                                                Chọn
                                                            </Button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="departureTime"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel className="text-xs font-bold uppercase tracking-widest text-[#802222]/60 ml-1">Lịch khởi hành</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input 
                                                            type="datetime-local" 
                                                            {...field} 
                                                            className="h-14 rounded-2xl bg-rose-50/10 border-rose-100/50 focus-visible:ring-[#802222]/20 text-lg transition-all"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-6">
                                        <Button type="submit" disabled={createTrip.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-[1.5rem] h-16 text-xl font-bold shadow-2xl shadow-rose-900/30 transition-all hover:scale-[1.01] active:scale-[0.98]">
                                            {createTrip.isPending ? "Đang thiết lập hành trình…" : "Tạo chuyến đi ngay"}
                                            <Save className="ml-3 h-6 w-6" />
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <SelectRouteDialog
                open={routeDialogOpen}
                onOpenChange={setRouteDialogOpen}
                onSelect={handleRouteSelect}
                selectedRouteId={selectedRoute?.id}
            />

            <SelectTrainDialog
                open={trainDialogOpen}
                onOpenChange={setTrainDialogOpen}
                onSelect={handleTrainSelect}
                selectedTrainId={selectedTrain?.id}
            />
        </div>
    )
}
