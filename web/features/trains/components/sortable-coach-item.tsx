"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Coach } from "@/lib/schemas/coach.schema"
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react"

interface SortableCoachItemProps {
    coach: Coach
    isSelected: boolean
    onSelect: (coachId: string) => void
}

export function SortableCoachItem({ coach, isSelected, onSelect }: SortableCoachItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: coach.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
    };

    // Use _count if available (from train list), otherwise use seats array (from detail)
    const seatCount = (coach as any)._count?.seats ?? coach.seats?.length ?? 0
    const availableCount = coach.seats
        ? coach.seats.filter(s => s.status === 'AVAILABLE').length
        : 0 // We don't have seat status in _count, so show 0

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 group/sortable">
            {/* Drag Handle */}
            <button
                className="cursor-grab active:cursor-grabbing touch-none p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover/sortable:text-[#802222] transition-colors" />
            </button>

            {/* Coach Button */}
            <button
                onClick={() => onSelect(coach.id)}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 min-w-[110px] group",
                    isSelected
                        ? "border-[#802222] bg-rose-50/50 dark:bg-rose-950/20 shadow-lg shadow-rose-900/10"
                        : "border-gray-100 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50/30 dark:hover:bg-rose-950/10"
                )}
            >
                <div className="flex flex-col items-center gap-1">
                    {/* Coach Name */}
                    <div className={cn(
                        "font-bold text-sm whitespace-nowrap transition-colors",
                        isSelected ? "text-[#802222] dark:text-rose-400" : "text-zinc-600 dark:text-zinc-400"
                    )}>
                        {coach.name}
                    </div>

                    {/* Coach Type - Full template name */}
                    <div className="text-[10px] font-medium text-muted-foreground/50 whitespace-nowrap text-center uppercase tracking-wider">
                        {coach.template.name}
                    </div>
                </div>

                {/* Seat Count */}
                <div className="flex items-center text-[10px] font-bold">
                    <span className={cn(
                        "transition-colors",
                        isSelected ? "text-[#802222]/60" : "text-muted-foreground/40"
                    )}>
                        {seatCount} CHỖ
                    </span>
                </div>
            </button>
        </div>
    )
}
