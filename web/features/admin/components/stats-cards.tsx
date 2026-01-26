"use client"

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"

export interface StatItem {
    title: string
    value: string
}

interface StatsCardsProps {
    stats: StatItem[]
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
                <Card key={index} className="shadow-sm">
                    <CardHeader>
                        <CardDescription>{stat.title}</CardDescription>
                        <CardTitle className="text-2xl font-bold">
                            {stat.value}
                        </CardTitle>
                    </CardHeader>
                </Card>
            ))}
        </div>
    )
}
