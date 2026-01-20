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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateRouteSchema, UpdateRouteInput } from "@/lib/schemas/route.schema"
import { useUpdateRoute } from "@/features/routes/hooks/use-route-mutations"
import { Route } from "@/lib/schemas/route.schema"

interface EditRouteDialogProps {
    route: Route;
    onSuccess?: () => void;
}

export function EditRouteDialog({ route, onSuccess }: EditRouteDialogProps) {
    const [open, setOpen] = React.useState(false)
    const updateRoute = useUpdateRoute()

    const form = useForm<UpdateRouteInput>({
        resolver: zodResolver(updateRouteSchema),
        defaultValues: {
            name: route.name,
            status: route.status,
            durationMinutes: route.durationMinutes,
            turnaroundMinutes: route.turnaroundMinutes,
        },
    })

    // Reset form when route changes
    React.useEffect(() => {
        form.reset({
            name: route.name,
            status: route.status,
            durationMinutes: route.durationMinutes,
            turnaroundMinutes: route.turnaroundMinutes,
        })
    }, [route, form])

    async function onSubmit(values: UpdateRouteInput) {
        updateRoute.mutate({ id: route.id, data: values }, {
            onSuccess: () => {
                toast.success("Cập nhật tuyến đường thành công")
                setOpen(false)
                onSuccess?.()
            },
            onError: (error) => {
                toast.error(error.message || "Cập nhật tuyến đường thất bại")
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
                    <DialogTitle>Sửa tuyến đường</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin tuyến đường. Nhấn lưu để hoàn tất.
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="durationMinutes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thời gian chạy (phút)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="VD: 1920"
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

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Trạng thái</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="draft">Nháp</SelectItem>
                                            <SelectItem value="active">Hoạt động</SelectItem>
                                            <SelectItem value="inactive">Không hoạt động</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={updateRoute.isPending}>
                                {updateRoute.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
