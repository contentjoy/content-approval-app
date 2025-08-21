'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
const THEME_KEY = 'theme'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  
  try {
    const stored = window.localStorage.getItem(THEME_KEY) as Theme | null
    if (stored === 'light' || stored === 'dark') return stored
    
    // If no stored preference, check system preference
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    return mq?.matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  // Apply theme on first paint (no flash)
  useEffect(() => {
    const html = document.documentElement
    html.classList.remove('light', 'dark')
    html.classList.add(theme)
    
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme])

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light')
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme
  }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
