'use client'

import { ThemeProvider as ShadcnThemeProvider } from '@/components/theme-provider'
import { ThemeProvider as ClientThemeProvider } from '@/contexts/theme-context'
import { ToastProvider } from '@/contexts/toast-context'
import { AuthProvider } from '@/contexts/auth-context'
import { Toaster } from '@/components/ui/toast/toaster'
import { usePathname } from 'next/navigation'
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
      <Toaster />
      {children}
    </ShadcnThemeProvider>
  ) : (
    <ClientThemeProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ClientThemeProvider>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <AuthProvider>
          {content}
        </AuthProvider>
      </body>
    </html>
  )
}