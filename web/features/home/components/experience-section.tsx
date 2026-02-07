import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import NextImage from "next/image"

const experiences = [
    {
        id: 1,
        title: "Ẩm thực Michelin",
        description: "Ẩm thực",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1000&auto=format&fit=crop", // Dining
        span: "col-span-1",
    },
    {
        id: 2,
        title: "Phòng Suites Toàn Cảnh",
        description: "Chỗ ở",
        image: "https://images.unsplash.com/photo-1590490360182-137d62341e1d?q=80&w=1000&auto=format&fit=crop", // Suite
        span: "col-span-1",
    },
    {
        id: 3,
        title: "Phòng Chờ Sang Trọng",
        description: "Thư giãn",
        image: "https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?q=80&w=1000&auto=format&fit=crop", // Lounge
        span: "col-span-1",
    }
]

export function ExperienceSection() {
    return (
        <section className="bg-background py-24 text-foreground">
            <div className="container mx-auto px-4">
                <div className="mb-12 flex items-end justify-between">
                    <div>
                        <h2 className="text-3xl font-bold sm:text-4xl text-foreground">Trải Nghiệm Cao Cấp</h2>
                        <p className="mt-2 text-muted-foreground">Tận hưởng những tiện nghi được tuyển chọn cho những du khách sành điệu nhất.</p>
                    </div>
                    <Button variant="link" className="text-primary hover:text-primary/80">
                        XEM TẤT CẢ <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-3 h-[500px]">
                    {experiences.map((item) => (
                        <div
                            key={item.id}
                            className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                        >
                            {/* Image Background Optimized */}
                            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                                <NextImage
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover object-center"
                                />
                            </div>
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-linear-to-t from-background via-background/95 to-background/5 p-6 flex flex-col justify-end">
                                <span className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                                    {item.description}
                                </span>
                                <h3 className="text-2xl font-bold text-foreground transition-colors group-hover:text-primary">
                                    {item.title}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
