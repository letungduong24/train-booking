"use client"

import * as React from "react"
import { TripSearchForm } from "./trip-search-form"
import Image from "next/image"

export function HeroSection() {
    return (
        <section className="relative h-screen w-full overflow-hidden">
            {/* Background Image Optimized */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/hero.jpg"
                    alt="Railflow - hệ thống đặt vé tàu trực tuyến"
                    fill
                    priority
                    className="object-cover object-center"
                    quality={90}
                />
                {/* Reverted overlay - lighter and transparent-to-background */}
                <div className="absolute inset-0 bg-background/30 dark:bg-black/40 bg-linear-to-t from-background via-background/80 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="mb-10 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-[#802222] text-white shadow-xl shadow-rose-900/30">
                            <span className="text-2xl font-black italic">R</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Railflow</span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 max-w-5xl leading-[1.1]">
                        Tìm chuyến tàu <span className="text-[#802222] dark:text-rose-400 italic">dễ dàng</span> cho mọi hành trình
                    </h1>
                    
                    <p className="mx-auto max-w-2xl text-base sm:text-lg text-zinc-500 dark:text-zinc-400 font-medium">
                        Chọn ga đi, ga đến và ngày khởi hành để xem chuyến phù hợp, đặt vé nhanh và theo dõi hành trình của bạn thật thuận tiện.
                    </p>
                </div>

                <div className="w-full max-w-4xl mt-12 shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <TripSearchForm />
                </div>
            </div>
        </section>
    )
}
