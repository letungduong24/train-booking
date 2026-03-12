import { CreditCard, History, MessageCircleMore, Search } from "lucide-react"

const features = [
    {
        icon: Search,
        title: "Tìm chuyến theo ga và ngày",
        description: "Tra cứu nhanh hành trình bằng ga đi, ga đến và ngày khởi hành để chọn chuyến tàu phù hợp nhất.",
    },
    {
        icon: CreditCard,
        title: "Thanh toán linh hoạt",
        description: "Hoàn tất đặt vé bằng VNPAY hoặc thanh toán trực tiếp từ ví điện tử sau khi thiết lập mã PIN bảo mật.",
    },
    {
        icon: History,
        title: "Theo dõi đơn và hành trình",
        description: "Kiểm tra trạng thái thanh toán, xem lịch sử đặt vé và quản lý các chuyến sắp khởi hành trong khu vực cá nhân.",
    },
    {
        icon: MessageCircleMore,
        title: "Trợ lý ảo hỗ trợ nhanh",
        description: "Đặt câu hỏi về chuyến tàu, lịch sử vé, số dư ví và các thông tin thường gặp ngay trong giao diện web.",
    },
]

export function FeatureSection() {
    return (
        <section className="bg-muted py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto mb-14 max-w-3xl text-center">
                    <h2 className="text-4xl font-extrabold text-foreground">
                        Một nền tảng cho toàn bộ <span className="text-primary">quy trình đặt vé</span>
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                        Railflow không chỉ tìm chuyến và đặt vé, mà còn hỗ trợ thanh toán, quản lý ví, tra cứu lịch sử và tương tác với trợ lý ảo ngay trên cùng hệ thống.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
                    {features.map((feature, idx) => (
                        <div key={idx} className="space-y-4 rounded-2xl border border-border bg-background p-6 shadow-sm">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
