"use client"

import * as React from "react"
import {
  IconBrandGoogleMaps,
  IconDashboard,
  IconInnerShadowTop,
  IconSettings,
  IconMapPin,
  IconCalendar,
  IconHome,
  IconCreditCard,
  type Icon,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useAuth } from "@/hooks/use-auth"

// Menu items
const navMain = [
  {
    title: "Bảng điều khiển",
    url: "/admin",
    icon: IconDashboard,
  },
  {
    title: "Tuyến đường",
    url: "/admin/routes",
    icon: IconBrandGoogleMaps,
  },
  {
    title: "Trạm dừng",
    url: "/admin/stations",
    icon: IconMapPin,
  },
  {
    title: "Chuyến đi",
    url: "/admin/trips",
    icon: IconCalendar,
  },
  {
    title: "Quản lý tàu",
    url: "/admin/trains",
    icon: IconBrandGoogleMaps,
  },
  {
    title: "Quản lý tài chính",
    url: "/admin/finance/withdrawals",
    icon: IconCreditCard,
  },
]

const navSecondary: {
  title: string
  url: string
  icon: Icon
}[] = []

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  const userData = {
    name: user?.name || "Admin",
    email: user?.email || "admin@example.com",
    avatar: "/avatars/shadcn.jpg", // TODO: Real avatar if available
  }

  const data = {
    navMain,
    navSecondary,
    user: userData
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Quản trị viên</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
