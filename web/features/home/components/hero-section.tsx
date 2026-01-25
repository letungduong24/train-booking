"use client"

import * as React from "react"
import { TripSearchForm } from "./trip-search-form"

export function HeroSection() {

    return (
        <section className="relative h-screen w-full overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(/images/hero.jpg)',
                }}
            >
                <div className="absolute inset-0 bg-background/30 dark:bg-black/40 bg-linear-to-t from-background via-background/80 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="mb-8 space-y-4">
                    <div className="font-bold text-primary text-4xl italic">
                        Railflow
                    </div>
                    <h1 className="text-5xl flex flex-col font-extrabold tracking-tight text-foreground sm:text-7xl md:text-8xl drop-shadow-md">
                        Nghệ thuật của <span className="text-primary italic">Chuyển Động</span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl drop-shadow-sm font-medium">
                        Trải nghiệm đỉnh cao của du lịch, nơi mỗi dặm đường là một kiệt tác của sự thoải mái, sang trọng và tầm nhìn toàn cảnh vô song.
                    </p>
                </div>

                {/* Search Widget */}
                <div className="w-full max-w-4xl mt-8">
                    <TripSearchForm />
                </div>
            </div>
        </section>
    )
}
