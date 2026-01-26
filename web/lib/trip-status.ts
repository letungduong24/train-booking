import { Clock, Train, AlertTriangle, CheckCircle2 } from "lucide-react";

export type TripStatus = 'SCHEDULED' | 'RUNNING' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';

export interface TripStatusInfo {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline" | null; // For Badge variant
    colorClass: string; // Tailiwd text/bg class
    icon?: any;
}

export const getTripStatusInfo = (status: string): TripStatusInfo => {
    switch (status) {
        case 'SCHEDULED':
            return {
                label: 'Đã lên lịch',
                variant: 'outline',
                colorClass: 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
                icon: Clock
            };
        case 'RUNNING':
            return {
                label: 'Đang chạy',
                variant: 'outline',
                colorClass: 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
                icon: Train
            };
        case 'DELAYED':
            return {
                label: 'Bị hoãn',
                variant: 'outline',
                colorClass: 'text-yellow-600 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
                icon: AlertTriangle
            };
        case 'CANCELLED':
            return {
                label: 'Đã hủy',
                variant: 'outline',
                colorClass: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
                icon: AlertTriangle
            };
        case 'COMPLETED':
            return {
                label: 'Hoàn thành',
                variant: 'outline',
                colorClass: 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700',
                icon: CheckCircle2
            };
        default:
            return {
                label: status,
                variant: 'outline',
                colorClass: 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700',
                icon: null
            };
    }
};
