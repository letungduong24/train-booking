"use client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { GlobalChatbot } from "@/components/chatbot/global-chatbot"
import { useAuth } from "@/hooks/use-auth"
import { 
  IconSearch, 
  IconBell, 
  IconCommand,
  IconUserCircle,
  IconLogout,
  IconHome,
  IconCreditCard
} from "@tabler/icons-react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const isAdmin = pathname?.startsWith('/admin');

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className={`flex h-(--header-height) shrink-0 items-center border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 transition-all ease-linear`}>
      <div className="flex w-full items-center gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 hidden md:block"
          />
        </div>

        {/* Search Bar */}
        <div className="hidden lg:flex relative group max-w-sm w-full ml-2">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-[#802222] transition-colors">
            <IconSearch className="size-4" />
          </div>
          <Input 
            placeholder="Tìm kiếm hành trình, vé..." 
            className="w-full pl-10 pr-16 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-none focus-visible:ring-1 focus-visible:ring-rose-500/20 text-sm transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-sm pointer-events-none">
            <IconCommand className="size-3 text-muted-foreground/40" />
            <span className="text-[10px] font-bold text-muted-foreground/60">K</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Action Icons */}
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <GlobalChatbot />
            <button className="size-9 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 text-muted-foreground/60 hover:text-[#802222] hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/20 relative">
              <IconBell className="size-5" />
              <span className="absolute top-2.5 right-2.5 size-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
            </button>
          </div>

          <Separator
            orientation="vertical"
            className="h-6 mx-1 hidden sm:block"
          />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-2 group cursor-pointer transition-opacity hover:opacity-80 outline-none border-none bg-transparent">
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {user?.name || "Khách"}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 leading-tight truncate max-w-[120px]">
                    {user?.email || "Chưa đăng nhập"}
                  </span>
                </div>
                <Avatar className="h-9 w-9 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={user?.profilePic ?? undefined} />
                  <AvatarFallback className="rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-bold">
                    {user?.name?.substring(0, 2).toUpperCase() || "GU"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl mt-1" align="end" sideOffset={8}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/dashboard/profile" className="flex items-center w-full">
                    <IconUserCircle className="mr-2 h-4 w-4 text-muted-foreground/60" />
                    <span>Tài khoản</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/dashboard/wallet" className="flex items-center w-full">
                    <IconCreditCard className="mr-2 h-4 w-4 text-muted-foreground/60" />
                    <span>Ví của tôi</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                  <Link href="/" className="flex items-center w-full">
                    <IconHome className="mr-2 h-4 w-4 text-muted-foreground/60" />
                    <span>Trang chủ</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-[#802222] focus:text-[#802222] focus:bg-rose-50">
                <IconLogout className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
