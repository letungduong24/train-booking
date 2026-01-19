"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Edit } from "lucide-react"

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
import { useUpdateCoach } from "@/features/trains/hooks/use-coach-mutations"
import { updateCoachSchema, UpdateCoachInput, Coach } from "@/lib/schemas/coach.schema"

interface EditCoachDialogProps {
    coach: Coach
}

export function EditCoachDialog({ coach }: EditCoachDialogProps) {
    const [open, setOpen] = React.useState(false)
    const updateCoach = useUpdateCoach()

    const form = useForm<UpdateCoachInput>({
        resolver: zodResolver(updateCoachSchema),
        defaultValues: {
            name: coach.name,
            order: coach.order,
        },
    })

    function onSubmit(values: UpdateCoachInput) {
        updateCoach.mutate(
            { id: coach.id, data: values },
            {
                onSuccess: () => {
                    toast.success("Cập nhật toa thành công")
                    setOpen(false)
                },
                onError: (error: any) => {
                    if (error.response?.status === 409) {
                        toast.error("Thứ tự toa đã tồn tại")
                    } else {
                        toast.error(error.response?.data?.message || "Đã có lỗi xảy ra")
                    }
                }
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 text-[10px]">
                    <Edit className="w-3 h-3 mr-1" />
                    Sửa toa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sửa thông tin toa</DialogTitle>
                    <DialogDescription>
                        Cập nhật tên hoặc thứ tự của toa. Template không thể thay đổi.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên toa</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Toa 1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="order"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Thứ tự</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={1}
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="text-sm text-muted-foreground">
                            <p><strong>Loại toa:</strong> {coach.template.name} ({coach.template.code})</p>
                            <p className="text-xs mt-1">Template không thể thay đổi sau khi tạo</p>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={updateCoach.isPending}>
                                {updateCoach.isPending ? "Đang cập nhật..." : "Cập nhật"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
