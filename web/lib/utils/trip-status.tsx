import { Badge } from "@/components/ui/badge";

export type TripStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

interface StatusBadgeConfig {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    className: string;
}

const STATUS_CONFIG: Record<TripStatus, StatusBadgeConfig> = {
    SCHEDULED: {
        label: "Chờ khởi hành",
        variant: "default",
        className: "bg-blue-500 hover:bg-blue-600",
    },
    IN_PROGRESS: {
        label: "Đang chạy",
        variant: "secondary",
        className: "bg-green-500 hover:bg-green-600 text-white",
    },
    COMPLETED: {
        label: "Hoàn thành",
        variant: "outline",
        className: "border-gray-400 text-gray-600",
    },
    CANCELLED: {
        label: "Đã hủy",
        variant: "destructive",
        className: "",
    },
};

export function getTripStatusBadge(status: string) {
    return STATUS_CONFIG[status as TripStatus] || STATUS_CONFIG.SCHEDULED;
}

export function TripStatusBadge({ status }: { status: string }) {
    const config = getTripStatusBadge(status);

    return (
        <Badge variant={config.variant} className={config.className}>
            {config.label}
        </Badge>
    );
}
