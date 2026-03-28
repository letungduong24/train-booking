"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { vi } from "date-fns/locale"

interface RecentBookingsTableProps {
  data: any[]
}

export function RecentBookingsTable({ data }: RecentBookingsTableProps) {
  return (
    <div className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-rose-900/[0.02]">
      <Table>
        <TableHeader className="bg-gray-50/50 dark:bg-zinc-800/50">
          <TableRow className="border-gray-100 dark:border-zinc-800 hover:bg-transparent">
            <TableHead className="font-bold text-[#802222] dark:text-rose-400">Mã đặt chỗ</TableHead>
            <TableHead className="font-bold text-[#802222] dark:text-rose-400">Khách hàng</TableHead>
            <TableHead className="font-bold text-[#802222] dark:text-rose-400">Chuyến đi</TableHead>
            <TableHead className="font-bold text-[#802222] dark:text-rose-400">Ngày đặt</TableHead>
            <TableHead className="font-bold text-[#802222] dark:text-rose-400 text-right">Tổng tiền</TableHead>
            <TableHead className="font-bold text-[#802222] dark:text-rose-400 text-center">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                Chưa có dữ liệu đặt vé.
              </TableCell>
            </TableRow>
          ) : (
            data.map((booking) => (
              <TableRow key={booking.id} className="border-gray-100 dark:border-zinc-800 hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition-colors">
                <TableCell className="font-mono font-medium text-xs">{booking.code}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{booking.user?.name || "N/A"}</span>
                    <span className="text-[10px] text-muted-foreground">{booking.user?.email || ""}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{booking.trip?.route?.name || "N/A"}</span>
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(booking.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                </TableCell>
                <TableCell className="text-right font-bold text-rose-600 dark:text-rose-400">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.totalPrice)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="outline" 
                    className={`rounded-full px-3 py-0.5 text-[10px] font-bold border-none ${
                      booking.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
                      booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
                      'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                    }`}
                  >
                    {booking.status === 'PAID' ? 'Đã thanh toán' :
                     booking.status === 'PENDING' ? 'Chờ thanh toán' : 
                     booking.status === 'CANCELLED' ? 'Đã hủy' : booking.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
