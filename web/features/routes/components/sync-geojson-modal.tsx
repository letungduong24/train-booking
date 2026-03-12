"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileJson } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSyncGeojson } from "@/features/routes/hooks/use-sync-geojson"

export function SyncGeojsonModal() {
    const router = useRouter()
    const syncMutation = useSyncGeojson()

    const [open, setOpen] = useState(false)
    const [stationsFile, setStationsFile] = useState<File | null>(null)
    const [linesFile, setLinesFile] = useState<File | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'stations' | 'lines') => {
        const file = e.target.files?.[0] || null
        if (type === 'stations') {
            setStationsFile(file)
        } else {
            setLinesFile(file)
        }
    }

    const handleSync = async () => {
        if (!stationsFile || !linesFile) {
            toast.error("Thiếu file", {
                description: "Vui lòng chọn cả 2 file Stations và Lines GeoJSON."
            })
            return
        }

        syncMutation.mutate({ stationsFile, linesFile }, {
            onSuccess: () => {
                setOpen(false)
                setStationsFile(null)
                setLinesFile(null)
                router.refresh()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Đồng bộ GeoJSON
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Đồng bộ dữ liệu Master</DialogTitle>
                    <DialogDescription>
                        Tải lên file GeoJSON chứa dữ liệu các Trạm và Tuyến đường ray (OpenStreetMap) để tự động tạo hệ thống Routes. Thao tác này có thể tốn vài chục giây tính toán khoảng cách.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label htmlFor="stations-file" className="text-sm font-medium">1. Stations GeoJSON (Points)</label>
                        <div className="flex items-center gap-2">
                            <input
                                id="stations-file"
                                type="file"
                                accept=".geojson,.json"
                                onChange={(e) => handleFileChange(e, 'stations')}
                                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>
                        {stationsFile && <p className="text-xs text-muted-foreground flex items-center gap-1"><FileJson className="h-3 w-3" /> {stationsFile.name}</p>}
                    </div>

                    <div className="grid gap-2">
                        <label htmlFor="lines-file" className="text-sm font-medium">2. Lines GeoJSON (LineStrings)</label>
                        <div className="flex items-center gap-2">
                            <input
                                id="lines-file"
                                type="file"
                                accept=".geojson,.json"
                                onChange={(e) => handleFileChange(e, 'lines')}
                                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>
                        {linesFile && <p className="text-xs text-muted-foreground flex items-center gap-1"><FileJson className="h-3 w-3" /> {linesFile.name}</p>}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={syncMutation.isPending}>
                        Hủy
                    </Button>
                    <Button onClick={handleSync} disabled={syncMutation.isPending || !stationsFile || !linesFile}>
                        {syncMutation.isPending ? "Đang xử lý toạ độ..." : "Bắt đầu Đồng bộ"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
