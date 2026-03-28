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
import { cn } from "@/lib/utils"

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
            <DialogContent className="w-[calc(100%-2rem)] max-w-2xl h-[80vh] p-0 flex flex-col gap-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-zinc-950 [&>button:last-child]:top-8 [&>button:last-child]:right-8">
                <DialogHeader className="p-8 pb-4 shrink-0 relative overflow-hidden">
                    <div className="relative z-10">
                        <DialogTitle className="text-2xl font-bold text-[#802222] dark:text-rose-400 tracking-tight">Danh sách hành khách</DialogTitle>
                        <DialogDescription className="text-xs font-medium text-muted-foreground/50">
                            Hệ thống đã ghi nhận {passengers.length} hành khách trên chuyến tàu này
                        </DialogDescription>
                    </div>
                    {/* Decorative header glow */}
                    <div className="absolute -right-20 -top-20 w-40 h-40 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-3xl z-0" />
                </DialogHeader>

                {/* Search Input Container */}
                <div className="px-8 pb-6 shrink-0">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#802222] opacity-40" />
                        <Input
                            placeholder="Tìm kiếm theo tên, CCCD, hoặc số ghế…"
                            className="pl-11 h-12 rounded-2xl bg-gray-50/50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800 focus:ring-rose-500/20 shadow-inner text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Passenger List */}
                <ScrollArea className="flex-1 min-h-0 px-8">
                    <div className="pb-8">
                        {filteredPassengers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-60 text-muted-foreground/40 bg-gray-50/30 dark:bg-zinc-800/20 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800">
                                <User className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm font-medium">
                                    {searchTerm
                                        ? "Không tìm thấy hành khách nào"
                                        : "Chưa có hành khách đặt vé"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredPassengers.map((passenger) => (
                                    <button
                                        key={passenger.id}
                                        onClick={() => handlePassengerClick(passenger)}
                                        className="w-full text-left p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:shadow-2xl hover:shadow-rose-900/10 transition-all duration-300 group relative overflow-hidden shadow-xl shadow-rose-900/[0.03]"
                                    >
                                        <div className="flex items-center justify-between gap-4 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-[#802222] text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-900/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                                    <User className="h-6 w-6" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="font-bold text-[#802222] dark:text-rose-400 text-base tracking-tight leading-none transition-colors">
                                                        {passenger.name}
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                                                            <span className="opacity-40 uppercase tracking-widest text-[8px]">CCCD</span>
                                                            <span className="font-mono tracking-widest opacity-80">{passenger.cccd}</span>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
                                                            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{passenger.coachName}</span>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                                            <span className="bg-rose-50 dark:bg-rose-900/20 text-[#802222] dark:text-rose-400 px-2 py-0.5 rounded-md">Ghế {passenger.seatName}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Premium glow reflection on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Results count */}
                {searchTerm && filteredPassengers.length > 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 border-t bg-muted/10 shrink-0">
                        Hiển thị {filteredPassengers.length} / {passengers.length} hành khách
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
