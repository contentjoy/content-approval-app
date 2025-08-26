import React from 'react'
import { Settings, Users, Moon, Sun, LogOut, Calendar as CalendarIcon } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { useAuth } from '@/contexts/auth-context'
import { useModalStore } from '@/hooks/use-modal-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProfileMenuProps {
  onAccountSettings?: () => void
  approvedProgress?: number
  goal?: number
}

export function ProfileMenu({ onAccountSettings, approvedProgress = 0, goal = 30 }: ProfileMenuProps) {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { openModal, approvedPosts } = useModalStore() as any

  const progressPct = Math.min(goal > 0 ? (approvedProgress / goal) * 100 : 0, 100)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open account menu"
          className="h-9 w-9 rounded-[999px] bg-card text-foreground flex items-center justify-center text-xs font-medium border border-border hover:bg-card/90 transition-colors"
        >
          <span className="leading-none">
            {(user?.gymName || 'G').charAt(0).toUpperCase()}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="text-muted-foreground">
          {user?.gymName || 'User'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onAccountSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Users className="h-4 w-4 mr-2" />
            Create Team
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openModal('schedule', null, [], approvedPosts || [])}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule Content
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
