"use client"

import * as React from "react"
import { toast } from "sonner"
import { Lock, Unlock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useUpdateCoach } from "@/features/trains/hooks/use-coach-mutations"
import { Coach } from "@/lib/schemas/coach.schema"
import { cn } from "@/lib/utils"

interface ToggleCoachStatusButtonProps {
    coach: Coach
}

export function ToggleCoachStatusButton({ coach }: ToggleCoachStatusButtonProps) {
    const updateCoach = useUpdateCoach()
    const isLocked = coach.status === 'LOCKED'

    const handleToggle = async () => {
        const newStatus = isLocked ? 'ACTIVE' : 'LOCKED'

        try {
            await updateCoach.mutateAsync({
                id: coach.id,
                data: { status: newStatus }
            });
            toast.success(isLocked ? `Đã mở khóa ${coach.name}` : `Đã khóa ${coach.name}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Cập nhật trạng thái thất bại");
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className={cn(
                "h-8 px-4 rounded-full text-[11px] font-bold transition-all shadow-sm border",
                isLocked 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30" 
                    : "bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800 hover:text-[#802222]"
            )}
            onClick={handleToggle}
            disabled={updateCoach.isPending}
        >
            {isLocked ? (
                <>
                    <Unlock className="w-3.5 h-3.5 mr-1.5" />
                    Mở khóa toa
                </>
            ) : (
                <>
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Khóa toa
                </>
            )}
        </Button>
    )
}
