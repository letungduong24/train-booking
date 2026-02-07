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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCreateCoach } from "@/features/trains/hooks/use-coach-mutations"
import { useCoachTemplates } from "@/features/trains/hooks/use-coach-templates"
import { createCoachSchema, CreateCoachInput } from "@/lib/schemas/coach.schema"
import { Skeleton } from "@/components/ui/skeleton"

interface CreateCoachDialogProps {
    trainId: string
}

export function CreateCoachDialog({ trainId }: CreateCoachDialogProps) {
    const [open, setOpen] = React.useState(false)
    const createCoach = useCreateCoach()
    const { data: templates, isLoading: templatesLoading } = useCoachTemplates()

    const form = useForm<CreateCoachInput>({
        resolver: zodResolver(createCoachSchema),
        defaultValues: {
            trainId,
            templateId: "",
        },
    })

    function onSubmit(values: CreateCoachInput) {
        createCoach.mutate(values, {
            onSuccess: () => {
                toast.success("Thêm toa mới thành công")
                setOpen(false)
                form.reset({
                    trainId,
                    templateId: "",
                })
            },
            onError: (error: any) => {
                if (error.response?.status === 409) {
                    toast.error("Thứ tự toa đã tồn tại")
                } else {
                    toast.error(error.response?.data?.message || "Đã có lỗi xảy ra")
                }
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm toa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm toa mới</DialogTitle>
                    <DialogDescription>
                        Chọn loại toa. Tên và thứ tự sẽ được tự động tạo.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="templateId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Loại toa</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn loại toa" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {templatesLoading ? (
                                                <div className="p-2 space-y-2">
                                                    <Skeleton className="h-8 w-full" />
                                                    <Skeleton className="h-8 w-full" />
                                                </div>
                                            ) : templates && templates.length > 0 ? (
                                                templates.map((template) => (
                                                    <SelectItem key={template.id} value={template.id}>
                                                        {template.name} ({template.code})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="empty" disabled>
                                                    Không có template
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={createCoach.isPending}>
                                {createCoach.isPending ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : "Tạo toa"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
