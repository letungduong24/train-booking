import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "../../../lib/api-client"
import { UpdateSeatInput } from "@/lib/schemas/seat.schema"

export function useUpdateSeat() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateSeatInput }) => {
            const response = await apiClient.patch(`/seats/${id}`, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["coaches"] })
            queryClient.invalidateQueries({ queryKey: ["seats"] })
        },
    })
}

