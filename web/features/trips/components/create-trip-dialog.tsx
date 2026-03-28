"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"

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
import { useCreateTrip } from "@/features/trips/hooks/use-trips"
import { createTripSchema, CreateTripInput } from "@/lib/schemas/trip.schema"
import { SelectRouteDialog } from "./select-route-dialog"
import { SelectTrainDialog } from "./select-train-dialog"
import { Route } from "@/lib/schemas/route.schema"
import { Train } from "@/lib/schemas/train.schema"

export function CreateTripDialog() {
    const [open, setOpen] = React.useState(false)
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
                setOpen(false)
                form.reset()
                setSelectedRoute(null)
                setSelectedTrain(null)
            },
            onError: (error: any) => {
                toast.error(error.response?.data?.message || "Đã có lỗi xảy ra")
            }
        })
    }

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Thêm chuyến đi
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 p-0 overflow-hidden [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                    <DialogHeader className="p-8 pb-4">
                        <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Thêm chuyến đi mới</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                            Nhập thông tin cho chuyến đi mới.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 pb-8 space-y-4">
                            <FormField
                                control={form.control}
                                name="routeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tuyến đường</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={selectedRoute?.name || ""}
                                                    placeholder="Chọn tuyến đường"
                                                    readOnly
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setRouteDialogOpen(true)}
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
                                    <FormItem>
                                        <FormLabel>Tàu</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={selectedTrain ? `${selectedTrain.code} - ${selectedTrain.name}` : ""}
                                                    placeholder="Chọn tàu"
                                                    readOnly
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setTrainDialogOpen(true)}
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
                                name="departureTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thời gian khởi hành</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={createTrip.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-full h-11 font-bold shadow-lg shadow-rose-900/20">
                                    {createTrip.isPending ? "Đang tạo..." : "Tạo chuyến đi"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

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
        </>
    )
}
