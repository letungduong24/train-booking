import { Leaf, Headset, ShieldCheck, Globe2 } from "lucide-react"

const features = [
    {
        icon: Leaf,
        title: "Du Lịch Bền Vững",
        description: "Đội tàu điện của chúng tôi giảm 85% lượng khí thải carbon so với các chuyến bay trong khu vực.",
    },
    {
        icon: Headset,
        title: "Hỗ Trợ 24/7",
        description: "Trợ lý cá nhân tận tâm biến mọi yêu cầu của bạn thành hiện thực trong suốt hành trình.",
    },
    {
        icon: ShieldCheck,
        title: "An Ninh Riêng Biệt",
        description: "Các giao thức bảo vệ và quyền riêng tư cấp cao, kín đáo cho tất cả các vị khách quý của chúng tôi.",
    },
    {
        icon: Globe2,
        title: "Mạng Lưới Toàn Cầu",
        description: "Các tuyến đường kết nối trải dài 14 quốc gia với sự chuyển tiếp liền mạch và xe đưa đón sang trọng.",
    },
]

export function FeatureSection() {
    return (
        <section className="bg-muted py-24">
            <div className="container mx-auto px-4">
                <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, idx) => (
                        <div key={idx} className="space-y-4">
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
