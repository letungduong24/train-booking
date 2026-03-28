import { IconTrendingUp, IconTrain, IconUsers, IconTicket, IconCash } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SectionCardsProps {
  data?: {
    totalRevenue: number;
    totalUsers: number;
    totalBookings: number;
    activeTrains: number;
    revenueTrend: number;
    usersTrend: number;
    bookingsTrend: number;
  }
}

export function SectionCards({ data }: SectionCardsProps) {
  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <IconTrendingUp className="size-3 text-emerald-500" />;
    if (trend < 0) return <IconTrendingUp className="size-3 text-rose-500 rotate-180" />;
    return null;
  };

  const getTrendText = (trend: number) => {
    if (trend > 0) return `Tăng ${trend}%`;
    if (trend < 0) return `Giảm ${Math.abs(trend)}%`;
    return "Không đổi";
  };

  const stats = [
    {
      title: "Tổng doanh thu",
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data?.totalRevenue || 0),
      description: "Doanh thu từ vé đã thanh toán",
      icon: IconCash,
      trend: data?.revenueTrend ?? 0,
    },
    {
      title: "Người dùng hệ thống",
      value: (data?.totalUsers || 0).toLocaleString(),
      description: "Tổng số tài khoản khách hàng",
      icon: IconUsers,
      trend: data?.usersTrend ?? 0,
    },
    {
      title: "Tổng số vé đặt",
      value: (data?.totalBookings || 0).toLocaleString(),
      description: "Số lượng đơn hàng trên hệ thống",
      icon: IconTicket,
      trend: data?.bookingsTrend ?? 0,
    },
    {
      title: "Đoàn tàu hoạt động",
      value: data?.activeTrains || 0,
      description: "Số tàu đang trạng thái ACTIVE",
      icon: IconTrain,
      trend: 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <Card key={i} className="rounded-[2rem] border-gray-100 dark:border-zinc-800 shadow-xl shadow-rose-900/[0.03] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl group hover:scale-[1.02] transition-all duration-500 overflow-hidden relative">
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-6 relative z-10">
            <div className="space-y-1">
              <CardDescription className="text-[10px] font-semibold text-muted-foreground/70">{stat.title}</CardDescription>
              <CardTitle className="text-2xl font-bold tracking-tight tabular-nums text-[#802222] dark:text-rose-400">
                {stat.value}
              </CardTitle>
            </div>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-[#802222] dark:text-rose-400">
                <stat.icon className="size-5" />
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 pb-8 pt-2 px-6 relative z-10">
            <div className="flex gap-1.5 items-center text-[10px] font-bold text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1 transition-transform">
              {stat.description}
            </div>
            <div className="text-[10px] font-medium text-muted-foreground/50 flex items-center gap-1">
                {stat.title !== "Đoàn tàu hoạt động" ? (
                  <>
                    {getTrendIcon(stat.trend)} {getTrendText(stat.trend)}
                  </>
                ) : (
                  "Ổn định"
                )}
            </div>
          </CardFooter>
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-100/30 dark:bg-rose-900/10 rounded-full blur-2xl z-0" />
          <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-2xl z-0" />
        </Card>
      ))}
    </div>
  )
}
