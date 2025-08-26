'use client'

import { ThemeProvider as ShadcnThemeProvider } from '@/components/theme-provider'
import { ThemeProvider as ClientThemeProvider } from '@/contexts/theme-context'
import { AuthProvider } from '@/contexts/auth-context'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith('/admin')

  // Always use ShadcnThemeProvider for consistent shadcn styling
  const content = (
    <ShadcnThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {isAdminRoute ? children : (
        <ClientThemeProvider>
          {children}
        </ClientThemeProvider>
      )}
    </ShadcnThemeProvider>
  )

  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <ShadcnThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {children}
              <Toaster richColors closeButton position="top-right" />
            </TooltipProvider>
          </ShadcnThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}