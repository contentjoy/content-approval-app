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

  // Wrap with appropriate theme provider based on route
  const content = isAdminRoute ? (
    <ShadcnThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ShadcnThemeProvider>
  ) : (
    <ClientThemeProvider>
      {children}
    </ClientThemeProvider>
  )

  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head />
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <TooltipProvider>
            {content}
            <Toaster richColors closeButton position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  )
}