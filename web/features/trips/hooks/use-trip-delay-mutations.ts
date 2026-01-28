import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

export const useTripDelayMutations = (tripId: string) => {
    const queryClient = useQueryClient();

    const setDepartureDelayMutation = useMutation({
        mutationFn: async (minutes: number) => {
            await apiClient.patch(`/trip/${tripId}/departure-delay`, { minutes });
        },
        onSuccess: () => {
            toast.success("Cập nhật delay khởi hành thành công");
            // Correct key is ['trips', tripId] based on use-trips.ts
            queryClient.invalidateQueries({ queryKey: ['trips', tripId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật delay");
        }
    });

    const setArrivalDelayMutation = useMutation({
        mutationFn: async (minutes: number) => {
            await apiClient.patch(`/trip/${tripId}/arrival-delay`, { minutes });
        },
        onSuccess: () => {
            toast.success("Cập nhật delay đến nơi thành công");
            queryClient.invalidateQueries({ queryKey: ['trips', tripId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật delay");
        }
    });

    return {
        setDepartureDelay: setDepartureDelayMutation.mutate,
        isSettingDepartureDelay: setDepartureDelayMutation.isPending,
        setArrivalDelay: setArrivalDelayMutation.mutate,
        isSettingArrivalDelay: setArrivalDelayMutation.isPending
    };
};
