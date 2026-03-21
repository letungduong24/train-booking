import Link from "next/link"
import { usePathname } from "next/navigation"
import { type Icon } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="p-0">
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu className="gap-1.5 px-2">
          {items.map((item) => {
            const isActive = pathname === item.url || (item.url !== '/dashboard' && item.url !== '/admin' && pathname?.startsWith(item.url));
            
            return (
              <SidebarMenuItem key={item.title} className="relative group/item">
                {isActive && (
                  <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.25 h-7 bg-[#802222] rounded-r-full z-20" />
                )}
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title}
                  className={cn(
                    "h-11 rounded-xl px-4 transition-all duration-200 border-none",
                    isActive 
                      ? "bg-[#802222]/5 dark:bg-[#802222]/10 text-[#802222] dark:text-rose-400 font-bold" 
                      : "text-muted-foreground/60 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-50/80 dark:hover:bg-zinc-900 font-medium"
                  )}
                  isActive={isActive}
                >
                  <Link href={item.url} className="flex items-center gap-3 w-full">
                    {item.icon && (
                      <item.icon className={cn(
                        "size-5 transition-colors shrink-0",
                        isActive ? "text-[#802222] dark:text-rose-400" : "text-muted-foreground/30 group-hover/item:text-muted-foreground/60"
                      )} />
                    )}
                    <span className="text-[15px] leading-tight flex-1">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

