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
  IconMap,
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
import { usePathname } from "next/navigation"

// Admin Menu items
const navAdmin = [
  {
    title: "Bảng điều khiển",
    url: "/admin",
    icon: IconDashboard,
  },
  {
    title: "Đồng bộ Mạng lưới",
    url: "/admin/network-sync",
    icon: IconMap,
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

// User Menu items
const navUser = [
  {
    title: "Trang chủ",
    url: "/dashboard",
    icon: IconHome,
  },
  {
    title: "Đặt vé",
    url: "/dashboard/booking",
    icon: IconBrandGoogleMaps,
  },
  {
    title: "Chuyến tàu",
    url: "/dashboard/trips",
    icon: IconCalendar,
  },
  {
    title: "Lịch sử",
    url: "/dashboard/history",
    icon: IconMap,
  },
  {
    title: "Ví của tôi",
    url: "/dashboard/wallet",
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
  const pathname = usePathname();

  const isAdminView = pathname?.startsWith('/admin');
  const isAdminUser = user?.role === 'ADMIN';

  // Base navigation
  let navMain = isAdminView ? navAdmin : navUser;

  // Add cross-navigation
  const crossNav: any[] = [];
  if (isAdminUser) {
    if (isAdminView) {
      crossNav.push({
        title: "Về Dashboard Người dùng",
        url: "/dashboard",
        icon: IconHome,
      });
    } else {
      crossNav.push({
        title: "Quản trị hệ thống",
        url: "/admin",
        icon: IconSettings,
      });
    }
  }

  const userData = {
    name: user?.name || "Người dùng",
    email: user?.email || "",
    avatar: user?.profilePic || "/avatars/shadcn.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <div className="flex flex-col gap-0.5">
                    <span className="text-lg font-black tracking-tight">Railflow</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-70">
                        {isAdminView ? "Admin Panel" : "User Panel"}
                    </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {crossNav.length > 0 && (
            <>
                <div className="px-4 py-2 mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                        Chuyển đổi
                    </p>
                </div>
                <NavMain items={crossNav} />
            </>
        )}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
