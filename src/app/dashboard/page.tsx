'use client'

import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import { TestConnection } from '@/components/test-connection'
import { BrandingProvider, useBranding } from '@/contexts/branding-context'

function DashboardContent() {
  const { gymName, agencyName, isLoading, error } = useBranding()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Logo size="lg" />
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">
              {isLoading ? 'Loading...' : gymName || 'Dashboard'}
            </h1>
            <p className="text-muted-text">
              {isLoading ? 'Loading branding...' : 
               error ? 'Error loading branding' : 
               `Welcome to your content approval dashboard${agencyName ? ` • ${agencyName}` : ''}`}
            </p>
          </div>
        </div>
      </div>
      
      {/* Test Connection Component */}
      <div className="mb-8">
        <TestConnection />
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-bg p-6 rounded-3xl border border-border shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-text">Total Content</p>
              <p className="text-2xl font-bold text-text">24</p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-bg p-6 rounded-3xl border border-border shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-text">Pending Approval</p>
              <p className="text-2xl font-bold text-accent-strong">8</p>
            </div>
            <div className="w-12 h-12 bg-accent-strong/10 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-bg p-6 rounded-3xl border border-border shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-text">Approved</p>
              <p className="text-2xl font-bold text-accent">12</p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-bg p-6 rounded-3xl border border-border shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-text">Rejected</p>
              <p className="text-2xl font-bold text-destructive">4</p>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-bg p-6 rounded-3xl border border-border shadow-soft">
          <h2 className="text-xl font-semibold mb-4 text-text">Recent Content</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 bg-bg-elev-1 rounded-2xl">
                <div>
                  <h3 className="font-medium text-text">Content Title {item}</h3>
                  <p className="text-sm text-muted-text">Updated 2 hours ago</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-accent-strong/10 text-accent-strong rounded-full border border-accent-strong/20">
                  Pending
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/content">
              <BrandedButton variant="outline" className="w-full">
                View All Content
              </BrandedButton>
            </Link>
          </div>
        </div>
        
        <div className="bg-bg p-6 rounded-3xl border border-border shadow-soft">
          <h2 className="text-xl font-semibold mb-4 text-text">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/content/new">
              <BrandedButton className="w-full justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Content
              </BrandedButton>
            </Link>
            <Link href="/approvals">
              <BrandedButton variant="outline" className="w-full justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Review Approvals
              </BrandedButton>
            </Link>
            <Link href="/content">
              <BrandedButton variant="outline" className="w-full justify-start">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Manage Content
              </BrandedButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <BrandingProvider>
      <DashboardContent />
    </BrandingProvider>
  )
}
