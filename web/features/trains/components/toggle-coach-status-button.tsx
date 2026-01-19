"use client"

import * as React from "react"
import { toast } from "sonner"
import { Lock, Unlock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useUpdateCoach } from "@/features/trains/hooks/use-coach-mutations"
import { Coach } from "@/lib/schemas/coach.schema"

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
            className={`h-7 px-2 text-[10px] ${isLocked ? 'text-green-600 hover:text-green-600 hover:bg-green-50' : 'text-yellow-600 hover:text-yellow-600 hover:bg-yellow-50'}`}
            onClick={handleToggle}
            disabled={updateCoach.isPending}
        >
            {isLocked ? (
                <>
                    <Unlock className="w-3 h-3 mr-1" />
                    Mở khóa
                </>
            ) : (
                <>
                    <Lock className="w-3 h-3 mr-1" />
                    Khóa toa
                </>
            )}
        </Button>
    )
}
