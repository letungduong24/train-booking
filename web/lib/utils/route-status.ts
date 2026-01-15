
export const translateRouteStatus = (status: string | undefined | null) => {
    if (!status) return "Không xác định";
    const statusLower = status.toLowerCase();

    switch (statusLower) {
        case "active":
            return "Hoạt động";
        case "inactive":
            return "Ngưng hoạt động";
        case "maintenance":
            return "Bảo trì";
        case "draft":
            return "Nháp";
        case "archived":
            return "Đã lưu trữ";
        default:
            return status;
    }
};

export const getRouteStatusColor = (status: string | undefined | null): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    if (!status) return "outline";
    const statusLower = status.toLowerCase();

    switch (statusLower) {
        case "active":
            return "default"; // or "success" if defined in components, but usually "default" is primary (green/black) or we use specific variants. User code used "default" for active.
        case "inactive":
            return "secondary";
        case "maintenance":
            return "destructive";
        case "draft":
            return "outline";
        default:
            return "outline";
    }
};
