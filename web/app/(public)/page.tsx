import { HeroSection } from "@/features/home/components/hero-section";
import { ExperienceSection } from "@/features/home/components/experience-section";
import { FeatureSection } from "@/features/home/components/feature-section";
import { JourneySection } from "@/features/home/components/journey-section";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <HeroSection />
            <ExperienceSection />
            <FeatureSection />
            <JourneySection />
            {/* Simple Footer Placeholder if needed, or global footer handles it */}
            <footer className="border-t border-border bg-muted py-12 text-center text-sm text-muted-foreground">
                <div className="container mx-auto px-4 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 font-bold text-foreground text-lg">
                        <span className="text-primary">Railflow</span>
                    </div>
                    <p>© 2026 Railflow. All right reserved</p>
                </div>
            </footer>
        </main>
    );
}
