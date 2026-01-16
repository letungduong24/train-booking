
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { IconPlus } from "@tabler/icons-react"

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
import { createRouteSchema, CreateRouteInput } from "@/features/routes/lib/route.schema"
import { useCreateRoute } from "@/features/routes/hooks/use-route-mutations"

interface CreateRouteDialogProps {
    onSuccess?: () => void;
}

export function CreateRouteDialog({ onSuccess }: CreateRouteDialogProps) {
    const [open, setOpen] = React.useState(false)
    const createRoute = useCreateRoute()

    const form = useForm<CreateRouteInput>({
        resolver: zodResolver(createRouteSchema),
        defaultValues: {
            name: "",
            // status default is handled by backend (draft)
        },
    })

    async function onSubmit(values: CreateRouteInput) {
        createRoute.mutate(values, {
            onSuccess: () => {
                setOpen(false)
                form.reset()
                onSuccess?.()
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
            <DialogContent className="sm:max-w-[425px]">
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



                        <DialogFooter>
                            <Button type="submit" disabled={createRoute.isPending}>
                                {createRoute.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
