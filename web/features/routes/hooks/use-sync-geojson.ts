import { useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import { toast } from "sonner"

interface SyncGeojsonParams {
    stationsFile: File
    linesFile: File
}

export const useSyncGeojson = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ stationsFile, linesFile }: SyncGeojsonParams) => {
            const formData = new FormData()
            formData.append('stations', stationsFile)
            formData.append('lines', linesFile)

            const response = await apiClient.post('/geojson/sync', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            return response.data
        },
        onSuccess: (response) => {
            const { data } = response
            toast.success("Đồng bộ dữ liệu Master gốc thành công", {
                description: `Đã xử lý ${data.stationsProcessed} trạm và kết nối mượt mà ${data.routeStationsLinked} khoảng cách trên đường ray.`,
            });
            // Invalidate the routes query to reflect newly synced items
            queryClient.invalidateQueries({ queryKey: ['routes'] })
            queryClient.invalidateQueries({ queryKey: ['stations'] })
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Đã có lỗi xảy ra khi xử lý GeoJSON."
            toast.error("Đồng bộ thất bại", {
                description: message
            })
        }
    })
}
