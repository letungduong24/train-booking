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
        <section className="bg-zinc-50 dark:bg-zinc-950 py-24">
            <div className="container mx-auto px-4">
                <div className="mx-auto mb-16 max-w-3xl text-center">
                    <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                        Một nền tảng cho toàn bộ <span className="text-[#802222] italic">quy trình đặt vé</span>
                    </h2>
                    <p className="mt-4 text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg">
                        Railflow không chỉ tìm chuyến và đặt vé, mà còn hỗ trợ thanh toán, quản lý ví, tra cứu lịch sử và tương tác với trợ lý ảo ngay trên cùng hệ thống.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {features.map((feature, idx) => (
                        <div key={idx} className="group p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl hover:shadow-rose-900/5 transition-all duration-300 hover:-translate-y-1">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-[#802222] dark:text-rose-400 mb-6 group-hover:scale-110 transition-transform">
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">{feature.title}</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
