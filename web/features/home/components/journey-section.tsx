"use client"

import Link from "next/link"
import { useAuthStore } from "@/lib/store/auth.store"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2 } from "lucide-react"

const journeys = [
    {
        id: 1,
        title: "Bắt đầu tìm và chọn chuyến phù hợp",
        tag: "Bước 1",
        image: "https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?q=80&w=1000&auto=format&fit=crop",
        description: "Nhập ga đi, ga đến và ngày khởi hành để xem nhanh các chuyến đang mở bán trong hệ thống.",
        highlights: ["Tra cứu theo ga", "Chọn ngày khởi hành", "Đi tới màn hình đặt vé"],
        ctaLabel: "Tìm chuyến ngay",
        href: "/booking",
    },
    {
        id: 2,
        title: "Thanh toán theo cách bạn thuận tiện nhất",
        tag: "Bước 2",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop",
        description: "Sau khi tạo đơn, bạn có thể tiếp tục thanh toán qua VNPAY hoặc ví điện tử đã được bảo vệ bằng mã PIN.",
        highlights: ["VNPAY / thẻ ngân hàng", "Ví điện tử cá nhân", "Bảo mật bằng mã PIN"],
        ctaLabel: "Tạo tài khoản",
        href: "/register",
    },
    {
        id: 3,
        title: "Quản lý vé và hành trình sau khi đặt",
        tag: "Bước 3",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop",
        description: "Theo dõi lịch sử đặt vé, trạng thái thanh toán và các chuyến sắp tới trong khu vực quản lý cá nhân.",
        highlights: ["Lịch sử đặt vé", "Trạng thái thanh toán", "Chuyến đi sắp tới"],
        ctaLabel: "Mở khu vực quản lý",
        href: "/dashboard",
    },
]

export function JourneySection() {
    const user = useAuthStore((state) => state.user)

    return (
        <section className="bg-background py-24 text-foreground">
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-extrabold italic text-foreground">
                        Quy trình sử dụng <span className="text-primary">Railflow</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Landing page được điều chỉnh theo đúng trải nghiệm hiện có của hệ thống: tìm chuyến, thanh toán, quản lý ví và theo dõi hành trình sau khi đặt.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {journeys.map((journey) => {
                        let finalHref = journey.href
                        if (user) {
                            if (journey.id === 1) finalHref = "/dashboard/booking"
                            if (journey.id === 2) finalHref = "/dashboard/wallet"
                        }

                        return (
                            <div
                                key={journey.id}
                                className="group relative h-96 overflow-hidden rounded-2xl border border-border bg-card"
                            >
                                <div
                                    className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                                    style={{
                                        backgroundImage: `url(${journey.image})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                    }}
                                />

                                <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-3xl font-bold text-white">{journey.title}</h3>
                                        <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                                            {journey.tag}
                                        </span>
                                    </div>

                                    <p className="mb-6 max-w-md text-gray-300">
                                        {journey.description}
                                    </p>

                                    <div className="border-t border-white/20 pt-4">
                                        <div className="mb-4 space-y-2 text-sm text-gray-200">
                                            {journey.highlights.map((highlight) => (
                                                <div key={highlight} className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    <span>{highlight}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Button asChild variant="outline" className="h-9 border-white/20 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white">
                                            <Link href={finalHref}>
                                                {user && journey.id === 2 ? "Nạp tiền ngay" : journey.ctaLabel}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
