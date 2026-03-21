'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { differenceInSeconds } from 'date-fns';
import { timeSync } from '@/lib/time-sync';

interface BookingTimerProps {
    expiresAt: string; // ISO string
    onExpire?: () => void;
}

export function BookingTimer({ expiresAt, onExpire }: BookingTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const expires = new Date(expiresAt);

        const calculateTimeLeft = () => {
            const now = timeSync.now();
            const diff = differenceInSeconds(expires, now);
            return diff > 0 ? diff : 0;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                if (onExpire) onExpire();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    if (timeLeft <= 0) {
        return <span className="text-destructive font-medium">Đã hết hạn</span>;
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-white shadow-md border border-rose-100/50 rounded-full font-mono text-[#802222] font-bold text-sm">
            <Clock className="h-4 w-4 animate-pulse fill-[#802222]/10" />
            <span>
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
}
