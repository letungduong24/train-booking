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
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            {/* Drag Handle */}
            <button
                className="cursor-grab touch-none p-1 hover:bg-accent rounded"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Coach Button */}
            <button
                onClick={() => onSelect(coach.id)}
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

                {/* Seat Count - only show total */}
                <div className="flex items-center text-xs">
                    <span className="text-muted-foreground">{seatCount} chỗ</span>
                </div>
            </button>
        </div>
    )
}
