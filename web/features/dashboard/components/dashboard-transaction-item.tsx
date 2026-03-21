'use client';

import { Transaction } from '@/features/dashboard/hooks/use-dashboard-overview';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ArrowDownCircle, ArrowUpCircle, RefreshCcw, HelpCircle } from 'lucide-react';

interface DashboardTransactionItemProps {
    transaction: Transaction;
}

export function DashboardTransactionItem({ transaction }: DashboardTransactionItemProps) {
    const getTransactionInfo = (type: string, status: string) => {
        let icon = CreditCard;
        let label = transaction.description || 'Giao dịch';
        let color = 'text-blue-600';
        let bgColor = 'bg-blue-100';

        switch (type) {
            case 'DEPOSIT':
                icon = ArrowDownCircle;
                color = 'text-green-600';
                bgColor = 'bg-green-100';
                break;
            case 'WITHDRAW':
                icon = ArrowUpCircle;
                color = 'text-red-600';
                bgColor = 'bg-red-100';
                break;
            case 'PAYMENT':
                icon = CreditCard;
                color = 'text-[#802222]';
                bgColor = 'bg-rose-50';
                break;
            case 'REFUND':
                icon = RefreshCcw;
                color = 'text-emerald-600';
                bgColor = 'bg-emerald-50';
                break;
        }

        let statusBadge = null;
        if (status === 'PENDING') {
            statusBadge = <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 h-5 px-2 text-[10px] font-medium ml-2">Đang xử lý</Badge>;
        } else if (status === 'FAILED') {
            statusBadge = <Badge variant="destructive" className="ml-2 h-5 px-2 text-[10px] font-medium bg-red-500 border-none">Thất bại</Badge>;
        }

        return { icon, label, color, bgColor, statusBadge };
    };

    const info = getTransactionInfo(transaction.type, transaction.status);
    const Icon = info.icon;

    return (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-none hover:border-[#802222]/20 transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${info.bgColor}`}>
                    <Icon className={`h-5 w-5 ${info.color}`} />
                </div>
                <div>
                    <div className="flex items-center">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{info.label}</p>
                        {info.statusBadge}
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground mt-1">
                        {format(new Date(transaction.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                    </p>
                </div>
            </div>
            <div className={`font-semibold text-base tabular-nums tracking-tighter ${transaction.amount > 0 ? 'text-emerald-600' : 'text-[#802222]'}`}>
                {transaction.amount > 0 ? '+' : ''}
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}
            </div>
        </div>
    );
}
