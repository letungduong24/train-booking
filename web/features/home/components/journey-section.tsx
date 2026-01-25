import { Button } from "@/components/ui/button"
import { Clock, Coffee } from "lucide-react"

const journeys = [
    {
        id: 1,
        title: "Paris tới Venice",
        price: "€4,500+",
        image: "https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?q=80&w=1000&auto=format&fit=crop", // Venice/Paris
        duration: "18h 30p",
        amenities: "Trọn gói",
    },
    {
        id: 2,
        title: "Tàu Tốc Hành Alpine",
        price: "€3,850+",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000&auto=format&fit=crop", // Alps
        duration: "12h 00p",
        amenities: "Toa Sức Khỏe",
    },
]

export function JourneySection() {
    return (
        <section className="bg-background py-24 text-foreground">
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="text-4xl font-extrabold italic text-foreground">
                        Hành Trình <span className="text-primary">Biểu Tượng</span>
                    </h2>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                    {journeys.map((journey) => (
                        <div
                            key={journey.id}
                            className="group relative h-96 overflow-hidden rounded-2xl border border-border bg-card"
                        >
                            {/* Image Background */}
                            <div
                                className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                                style={{
                                    backgroundImage: `url(${journey.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />

                            {/* Content */}
                            <div className="absolute inset-0 bg-linear-to-t from-background via-background/50 to-transparent" />
                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-3xl font-bold text-white">{journey.title}</h3>
                                    <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                                        {journey.price}
                                    </span>
                                </div>

                                <p className="mb-6 max-w-md text-gray-300">
                                    Chuyến thám hiểm núi đỉnh cao với những cung đường sắt cao nhất và tiện nghi chăm sóc sức khỏe.
                                </p>

                                <div className="flex items-center justify-between border-t border-white/20 pt-4">
                                    <div className="flex gap-4 text-xs font-medium text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {journey.duration}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Coffee className="h-3 w-3" /> {journey.amenities}
                                        </div>
                                    </div>
                                    <Button variant="outline" className="h-8 border-white/20 bg-white/10 text-xs text-white hover:bg-white/20 hover:text-white">
                                        ĐẶT VÉ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
