"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTrains } from "@/features/trains/hooks/use-trains"
import { Train } from "@/lib/schemas/train.schema"

interface SelectTrainDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (train: Train) => void
    selectedTrainId?: string
}

export function SelectTrainDialog({ open, onOpenChange, onSelect, selectedTrainId }: SelectTrainDialogProps) {
    const [searchValue, setSearchValue] = React.useState("")
    const [page, setPage] = React.useState(1)

    const { data: trainData } = useTrains({
        page,
        limit: 5,
        search: searchValue,
    })

    const trains = trainData?.data || []
    const meta = trainData?.meta || { total: 0, page: 1, limit: 5, totalPages: 0 }

    const handleSelect = (train: Train) => {
        onSelect(train)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle>Chọn tàu</DialogTitle>
                    <DialogDescription>
                        Tìm kiếm và chọn tàu cho chuyến đi
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Input
                        placeholder="Tìm kiếm tàu..."
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value)
                            setPage(1)
                        }}
                    />

                    <ScrollArea className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã tàu</TableHead>
                                    <TableHead>Tên tàu</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {trains.length > 0 ? (
                                    trains.map((train) => (
                                        <TableRow key={train.id}>
                                            <TableCell className="font-medium">{train.code}</TableCell>
                                            <TableCell>{train.name}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    variant={selectedTrainId === train.id ? "default" : "outline"}
                                                    onClick={() => handleSelect(train)}
                                                >
                                                    {selectedTrainId === train.id ? "Đã chọn" : "Chọn"}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Không có tàu khả dụng
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    {/* Pagination */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground text-center sm:text-left">
                            {trains.length} / {meta.total} tàu
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="h-8 px-2"
                            >
                                Trước
                            </Button>
                            <div className="flex items-center px-2 text-sm whitespace-nowrap">
                                {meta.page} / {meta.totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => p + 1)}
                                disabled={page >= meta.totalPages}
                                className="h-8 px-2"
                            >
                                Tiếp
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
