import * as React from "react"

export function TableContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-white overflow-hidden border border-gray-100 shadow-lg shadow-rose-900/[0.015]">
            {children}
        </div>
    )
}