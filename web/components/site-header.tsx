"use client"
import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { GlobalChatbot } from "@/components/chatbot/global-chatbot"
import { Badge } from "@/components/ui/badge"

export function SiteHeader() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <header className={`flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-all ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) ${isAdmin ? 'bg-primary/[0.03] border-b-primary/20' : ''}`}>
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col">
          <h1 className="text-sm font-bold leading-none flex items-center gap-2">
            Railflow {isAdmin && <Badge variant="outline" className="text-[10px] uppercase py-0 px-2 bg-primary text-white border-none">Admin</Badge>}
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GlobalChatbot />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
