import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="rounded-[2rem] border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 relative z-10">
          <div className="space-y-1">
            <CardDescription className="text-[10px] font-semibold text-muted-foreground/70">Tổng doanh thu</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight tabular-nums text-[#802222] dark:text-rose-400">
              $1,250.00
            </CardTitle>
          </div>
          <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-none rounded-full px-2.5 py-1 text-[10px] font-semibold flex gap-1 items-center">
            <IconTrendingUp className="size-3" />
            +12.5%
          </Badge>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pb-8 pt-2 px-6 relative z-10">
          <div className="flex gap-1.5 items-center text-[10px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1 transition-transform">
            Tăng trưởng <IconTrendingUp className="size-3 text-emerald-500" />
          </div>
          <div className="text-[10px] font-medium text-muted-foreground/50">
            So với 6 tháng qua
          </div>
        </CardFooter>
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-2xl z-0" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-2xl z-0" />
      </Card>

      <Card className="rounded-[2rem] border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 relative z-10">
          <div className="space-y-1">
            <CardDescription className="text-[10px] font-semibold text-muted-foreground/70">Khách hàng mới</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight tabular-nums text-[#802222] dark:text-rose-400">
              1,234
            </CardTitle>
          </div>
          <Badge className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border-none rounded-full px-2.5 py-1 text-[10px] font-semibold flex gap-1 items-center">
            <IconTrendingDown className="size-3" />
            -20%
          </Badge>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pb-8 pt-2 px-6 relative z-10">
          <div className="flex gap-1.5 items-center text-[10px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1 transition-transform">
            Giảm nhẹ <IconTrendingDown className="size-3 text-rose-500" />
          </div>
          <div className="text-[10px] font-medium text-muted-foreground/50">
            Cần chú ý tệp khách hàng
          </div>
        </CardFooter>
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-2xl z-0" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-2xl z-0" />
      </Card>

      <Card className="rounded-[2rem] border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 relative z-10">
          <div className="space-y-1">
            <CardDescription className="text-[10px] font-semibold text-muted-foreground/70">Tài khoản hoạt động</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight tabular-nums text-[#802222] dark:text-rose-400">
              45,678
            </CardTitle>
          </div>
          <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-none rounded-full px-2.5 py-1 text-[10px] font-semibold flex gap-1 items-center">
            <IconTrendingUp className="size-3" />
            +12.5%
          </Badge>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pb-8 pt-2 px-6 relative z-10">
          <div className="flex gap-1.5 items-center text-[10px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1 transition-transform">
            Duy trì tốt <IconTrendingUp className="size-3 text-emerald-500" />
          </div>
          <div className="text-[10px] font-medium text-muted-foreground/50">
            Tương tác vượt mục tiêu
          </div>
        </CardFooter>
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-2xl z-0" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-2xl z-0" />
      </Card>

      <Card className="rounded-[2rem] border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 relative z-10">
          <div className="space-y-1">
            <CardDescription className="text-[10px] font-semibold text-muted-foreground/70">Tỷ lệ tăng trưởng</CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight tabular-nums text-[#802222] dark:text-rose-400">
              4.5%
            </CardTitle>
          </div>
          <Badge className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-none rounded-full px-2.5 py-1 text-[10px] font-semibold flex gap-1 items-center">
            <IconTrendingUp className="size-3" />
            +4.5%
          </Badge>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 pb-8 pt-2 px-6 relative z-10">
          <div className="flex gap-1.5 items-center text-[10px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1 transition-transform">
            Tăng trưởng đều <IconTrendingUp className="size-3 text-emerald-500" />
          </div>
          <div className="text-[10px] font-medium text-muted-foreground/50">
            Theo đúng lộ trình
          </div>
        </CardFooter>
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-2xl z-0" />
        <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-2xl z-0" />
      </Card>
    </div>
  )
}
