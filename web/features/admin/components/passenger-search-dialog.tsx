"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, User } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface PassengerInfo {
    id: string
    name: string
    cccd: string
    seatId: string
    seatName: string
    coachId: string
    coachName: string
    status: 'BOOKED' | 'HOLDING'
}

interface PassengerSearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    passengers: PassengerInfo[]
    onPassengerClick: (seatId: string, coachId: string) => void
}

export function PassengerSearchDialog({
    open,
    onOpenChange,
    passengers,
    onPassengerClick,
}: PassengerSearchDialogProps) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredPassengers = passengers.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cccd.includes(searchTerm) ||
        p.seatName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handlePassengerClick = (passenger: PassengerInfo) => {
        onPassengerClick(passenger.seatId, passenger.coachId)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Danh sách hành khách</DialogTitle>
                    <DialogDescription>
                        {passengers.length} hành khách đã đặt vé
                    </DialogDescription>
                </DialogHeader>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo tên, CCCD, hoặc số ghế…"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Passenger List */}
                <ScrollArea className="h-[400px] pr-4">
                    {filteredPassengers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <User className="h-12 w-12 mb-2 opacity-20" />
                            <p className="text-sm">
                                {searchTerm
                                    ? "Không tìm thấy hành khách"
                                    : "Chưa có hành khách đặt vé"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredPassengers.map((passenger) => (
                                <button
                                    key={passenger.id}
                                    onClick={() => handlePassengerClick(passenger)}
                                    className="w-full text-left p-4 rounded-lg border hover:bg-accent hover:border-primary transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{passenger.name}</span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                CCCD: {passenger.cccd}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {passenger.coachName} - Ghế {passenger.seatName}
                                            </div>
                                        </div>
                                        <Badge
                                            variant={passenger.status === 'BOOKED' ? 'default' : 'secondary'}
                                        >
                                            {passenger.status === 'BOOKED' ? 'Đã bán' : 'Đang giữ'}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Results count */}
                {searchTerm && filteredPassengers.length > 0 && (
                    <div className="text-sm text-muted-foreground text-center">
                        Hiển thị {filteredPassengers.length} / {passengers.length} hành khách
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
