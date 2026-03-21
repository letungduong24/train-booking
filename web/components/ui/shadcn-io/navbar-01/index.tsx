'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { GlobalChatbot } from '@/components/chatbot/global-chatbot';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut, UserCircle, Menu as MenuIcon, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Hamburger icon component
export const HamburgerIcon = ({ className, ...props }: React.SVGAttributes<SVGElement>) => (
  <svg
    className={cn('pointer-events-none', className)}
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...(props as any)}
  >
    <path
      d="M4 12L20 12"
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-315"
    />
    <path
      d="M4 12H20"
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
    />
    <path
      d="M4 12H20"
      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-135"
    />
  </svg>
);

// Types
export interface Navbar01NavLink {
  href: string;
  label: string;
  active?: boolean;
}

export interface Navbar01Props extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: Navbar01NavLink[];
  signInText?: string;
  signInHref?: string;
  ctaText?: string;
  ctaHref?: string;
  onSignInClick?: () => void;
  onCtaClick?: () => void;
  showUserDropdown?: boolean;
  onProfileClick?: () => void;
  onLogoutClick?: () => void;
  hideCta?: boolean;
  signInAsPrimary?: boolean;
}

const defaultNavigationLinks: Navbar01NavLink[] = [
  { href: '#', label: 'Trang chủ', active: true },
  { href: '#features', label: 'Tính năng' },
  { href: '#pricing', label: 'Giá vé' },
  { href: '#about', label: 'Về chúng tôi' },
];

export const Navbar01 = React.forwardRef<HTMLElement, Navbar01Props>(
  (
    {
      className,
      navigationLinks = defaultNavigationLinks,
      signInText = 'Đăng nhập',
      signInHref = '#signin',
      ctaText = 'Bắt đầu',
      ctaHref = '#get-started',
      onSignInClick,
      onCtaClick,
      showUserDropdown = false,
      onProfileClick,
      onLogoutClick,
      hideCta = false,
      signInAsPrimary = false,
      ...props
    },
    ref
  ) => {
    const router = useRouter();
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 1024);
        }
      };
      checkWidth();
      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    const combinedRef = React.useCallback((node: HTMLElement | null) => {
      containerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as any).current = node;
    }, [ref]);

    return (
      <header
        ref={combinedRef}
        className={cn(
          'sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 px-4 md:px-6 shadow-sm transition-all',
          className
        )}
        {...(props as any)}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="h-9 w-9 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    variant="ghost"
                    size="icon"
                  >
                    <MenuIcon className="size-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2 rounded-2xl shadow-xl border-gray-100 dark:border-zinc-800">
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-1">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem key={index} className="w-full">
                          <button
                            onClick={() => router.push(link.href)}
                            className={cn(
                              "flex w-full items-center rounded-xl px-4 py-2.5 text-[15px] font-medium transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer no-underline capitalize",
                              link.active
                                ? "text-[#802222] bg-[#802222]/5 font-bold"
                                : "text-zinc-500 dark:text-zinc-400"
                            )}
                          >
                            {link.label}
                          </button>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}

            {/* Logo */}
            <div 
              className="flex items-center gap-3 group cursor-pointer" 
              onClick={() => router.push('/')}
            >
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#802222] text-white shadow-lg shadow-rose-900/20 transition-transform group-hover:scale-105">
                <span className="text-lg font-black italic">R</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Railflow</span>
            </div>

            {/* Desktop Nav */}
            {!isMobile && (
              <NavigationMenu className="flex">
                <NavigationMenuList className="gap-1">
                  {navigationLinks.map((link, index) => (
                    <NavigationMenuItem key={index}>
                      <button
                        onClick={() => router.push(link.href)}
                        className={cn(
                          "group inline-flex h-9 w-max items-center justify-center rounded-xl px-4 py-2 text-[14px] font-medium transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 focus:outline-none cursor-pointer no-underline capitalize",
                          link.active
                            ? "text-[#802222] font-bold"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                        )}
                      >
                        {link.label}
                      </button>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
                <GlobalChatbot />
            </div>

            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

            {showUserDropdown ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-4 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 gap-2 border border-transparent hover:border-gray-100 dark:hover:border-zinc-800"
                  >
                    {signInText}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl mt-1 shadow-xl border-gray-100 dark:border-zinc-800">
                  <DropdownMenuItem
                    className="rounded-xl cursor-pointer py-2.5 px-3"
                    onClick={() => onProfileClick?.()}
                  >
                    <UserCircle className="mr-2 h-4 w-4 text-zinc-400" />
                    <span className="font-medium">Hồ sơ</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl cursor-pointer py-2.5 px-3 text-[#802222] focus:text-[#802222] focus:bg-rose-50"
                    onClick={() => onLogoutClick?.()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="font-medium">Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-4 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 border border-transparent hover:border-gray-100 dark:hover:border-zinc-800"
                  onClick={() => onSignInClick?.()}
                >
                  {signInText}
                </Button>
                {!hideCta && (
                  <Button
                    size="sm"
                    className="h-10 px-5 rounded-xl text-sm font-bold bg-[#802222] hover:bg-[#6b1c1c] text-white shadow-lg shadow-rose-900/20 transition-all border-none"
                    onClick={() => onCtaClick?.()}
                  >
                    {ctaText}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }
);

const Separator = ({ orientation, className }: { orientation: 'vertical' | 'horizontal', className?: string }) => (
    <div className={cn("bg-gray-100 dark:bg-zinc-800", orientation === 'vertical' ? "w-[1px] h-full" : "h-[1px] w-full", className)} />
)