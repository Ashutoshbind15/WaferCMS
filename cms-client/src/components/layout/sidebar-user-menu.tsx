import { Check, LogOut, Moon, Sun } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { useTheme } from "@/components/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export function SidebarUserMenu() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  const username = user?.username ?? "Portfolio CMS"
  const initial = username.charAt(0).toUpperCase()

  const themeIcons = (
    <span className="relative flex size-4 shrink-0 items-center justify-center">
      <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </span>
  )

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" tooltip={username}>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
              {initial}
            </div>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{username}</span>
            </div>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" sideOffset={8}>
          <DropdownMenuLabel>{username}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {themeIcons}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
                {theme === "light" && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
                {theme === "dark" && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
                {theme === "system" && <Check className="ml-auto size-4" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => void logout()}
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}
