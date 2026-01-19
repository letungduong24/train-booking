"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Coach } from "@/lib/schemas/coach.schema"

interface CoachNavigationBarProps {
    coaches: Coach[]
    selectedCoachId: string
    onCoachSelect: (coachId: string) => void
    trainCode: string
}

export function CoachNavigationBar({
    coaches,
    selectedCoachId,
    onCoachSelect,
    trainCode,
}: CoachNavigationBarProps) {
    return (
        <div className="w-full overflow-x-auto">
            <div className="flex items-center min-w-max">
                {/* Train Engine */}
                <div className="relative flex items-center justify-center ps-7 pe-4 py-2 md:py-3 bg-primary text-primary-foreground font-bold text-sm self-stretch min-w-[120px] max-w-[120px]"
                    style={{
                        clipPath: 'polygon(46% 0, 100% 0, 100% 100%, 0% 100%)'
                    }}>
                    {trainCode}
                </div>

                {/* Rail Track after Engine */}
                <div className="flex flex-col gap-1.5 flex-1 items-center justify-center min-w-[12px]">
                    <div className="h-0.5 w-full max-w-[60px] bg-muted-foreground"></div>
                    <div className="h-0.5 w-full max-w-[60px] bg-muted-foreground"></div>
                </div>

                {coaches.map((coach, index) => {
                    const isSelected = coach.id === selectedCoachId
                    const seatCount = coach.seats.length
                    const availableCount = coach.seats.filter(s => s.status === 'AVAILABLE').length

                    return (
                        <React.Fragment key={coach.id}>
                            <button
                                onClick={() => onCoachSelect(coach.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-2 md:p-3 rounded-lg border-2 transition-all",
                                    isSelected
                                        ? "border-primary bg-primary/10 shadow-md"
                                        : "border-border hover:border-primary/50 hover:bg-accent"
                                )}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    {/* Coach Name */}
                                    <div className="font-medium text-sm truncate">
                                        <span className="truncate">{coach.name}</span>
                                    </div>

                                    {/* Coach Type - Full template name */}
                                    <div className="text-xs text-muted-foreground truncate text-center max-w-[120px]">
                                        {coach.template.name}
                                    </div>
                                </div>

                                {/* Seat Count */}
                                <div className="flex items-center text-xs">
                                    <span className="font-semibold">{availableCount}</span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="text-muted-foreground">{seatCount}</span>
                                </div>
                            </button>

                            {/* Rail Track Separator - Expands to fill space */}
                            {index < coaches.length - 1 && (
                                <div className="flex flex-col gap-1.5 flex-1 items-center justify-center min-w-[12px]">
                                    <div className="h-0.5 w-full max-w-[60px] bg-muted-foreground"></div>
                                    <div className="h-0.5 w-full max-w-[60px] bg-muted-foreground"></div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
