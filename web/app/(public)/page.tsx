import { HeroSection } from "@/features/home/components/hero-section";
import { FeatureSection } from "@/features/home/components/feature-section";
import { LatestTripsSection } from "@/features/home/components/latest-trips-section";

export default function Home() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <HeroSection />
            <LatestTripsSection />
            <FeatureSection />
            <footer className="border-t border-border bg-muted py-12 text-center text-sm text-muted-foreground">
                <div className="container mx-auto px-4 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 font-bold text-foreground text-lg">
                        <span className="text-primary">Railflow</span>
                    </div>
                    <p>© 2026 Railflow. Nền tảng đặt vé tàu, thanh toán và quản lý hành trình.</p>
                </div>
            </footer>
        </main>
    );
}
