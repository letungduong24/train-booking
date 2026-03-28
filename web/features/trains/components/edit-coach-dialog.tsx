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
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Sửa thông tin toa</DialogTitle>
                    <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                        Cập nhật tên hoặc thứ tự của toa. Template không thể thay đổi.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 pb-8 space-y-4">
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
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={updateCoach.isPending} className="w-full bg-[#802222] hover:bg-rose-900 text-white rounded-full h-11 font-bold shadow-lg shadow-rose-900/20">
                                {updateCoach.isPending ? "Đang cập nhật..." : "Cập nhật"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
