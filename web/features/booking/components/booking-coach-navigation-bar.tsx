"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Train } from "lucide-react"

interface BookingCoachNavigationBarProps {
    coaches: {
        id: string;
        name: string;
        template: {
            name: string;
        };
        _count?: {
            seats: number;
        };
    }[];
    selectedCoachId: string | null;
    onCoachSelect: (coachId: string) => void;
    trainCode: string;
}

export function BookingCoachNavigationBar({
    coaches,
    selectedCoachId,
    onCoachSelect,
    trainCode,
}: BookingCoachNavigationBarProps) {
    return (
        <div className="w-full overflow-x-auto pb-4">
            <div className="flex items-center min-w-max">
                {/* Train Engine */}
                <div className="relative flex items-center justify-center ps-7 pe-4 py-2 md:py-3 bg-[#802222] text-white font-bold text-sm self-stretch min-w-[120px] max-w-[120px]"
                    style={{
                        clipPath: 'polygon(46% 0, 100% 0, 100% 100%, 0% 100%)'
                    }}>
                    <Train className="mr-2 h-4 w-4" />
                    {trainCode}
                </div>

                {/* Rail Track after Engine */}
                <div className="flex flex-col gap-1.5 flex-none w-8 items-center justify-center">
                    <div className="h-0.5 w-full bg-muted-foreground"></div>
                    <div className="h-0.5 w-full bg-muted-foreground"></div>
                </div>

                {coaches.map((coach, index) => {
                    const isSelected = coach.id === selectedCoachId
                    const seatCount = coach._count?.seats || 0

                    return (
                        <React.Fragment key={coach.id}>
                            <button
                                onClick={() => onCoachSelect(coach.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 min-w-[110px] group",
                                    isSelected
                                        ? "border-[#802222] bg-rose-50/50 dark:bg-rose-950/20 shadow-lg shadow-rose-900/10"
                                        : "border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/10"
                                )}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    {/* Coach Name */}
                                    <div className="font-medium text-sm whitespace-nowrap">
                                        {coach.name}
                                    </div>

                                    {/* Coach Type - Full template name */}
                                    <div className="text-xs text-muted-foreground whitespace-nowrap text-center">
                                        {coach.template.name}
                                    </div>
                                </div>

                                {/* Seat Count */}
                                <div className="flex items-center text-xs">
                                    <span className="font-semibold text-muted-foreground">{seatCount} chỗ</span>
                                </div>
                            </button>

                            {/* Rail Track Separator - Expands to fill space */}
                            {index < coaches.length - 1 && (
                                <div className="flex flex-col gap-1.5 flex-none w-8 items-center justify-center">
                                    <div className="h-0.5 w-full bg-muted-foreground"></div>
                                    <div className="h-0.5 w-full bg-muted-foreground"></div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
