'use client'

import React from 'react'
import Link from 'next/link'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { useBranding } from '@/contexts/branding-context'

export function Header() {
  const { gymName, isLoading } = useBranding()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Logo size="md" />
          {gymName && !isLoading && (
            <span className="text-sm text-gray-500 hidden sm:inline">
              • {gymName}
            </span>
          )}
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors">
            Dashboard
          </Link>
          <Link href="/content" className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors">
            Content
          </Link>
          <Link href="/approvals" className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors">
            Approvals
          </Link>
          <BrandedButton variant="primary" size="sm">
            Sign In
          </BrandedButton>
        </nav>
      </div>
    </header>
  )
}
