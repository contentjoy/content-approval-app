'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBranding } from '@/contexts/branding-context'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { ProgressBar } from '@/components/ui/progress-bar'

const onboardingSteps = [
  {
    id: 1,
    title: 'Welcome to ContentJoy',
    description: 'Let&apos;s get you set up with your content approval workflow.',
    content: 'WelcomeStep'
  },
  {
    id: 2,
    title: 'Connect Your Social Media',
    description: 'Connect your social media accounts to start managing content.',
    content: 'SocialMediaStep'
  },
  {
    id: 3,
    title: 'Set Up Approval Workflow',
    description: 'Configure who can approve content and how the process works.',
    content: 'WorkflowStep'
  },
  {
    id: 4,
    title: 'Upload Your First Content',
    description: 'Learn how to upload and manage your content.',
    content: 'UploadStep'
  },
  {
    id: 5,
    title: 'You&apos;re All Set!',
    description: 'Your content approval system is ready to go.',
    content: 'CompleteStep'
  }
]

function WelcomeStep() {
  const { gymName, agencyName } = useBranding()
  
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-[var(--brand-primary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Welcome to {gymName || 'ContentJoy'}!
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {agencyName ? `${agencyName} has partnered with ContentJoy to help you manage your social media content more efficiently.` : 'ContentJoy helps you manage your social media content more efficiently.'}
      </p>
      <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 mb-2">What you&apos;ll be able to do:</h3>
        <ul className="text-sm text-gray-600 space-y-2 text-left">
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Upload and organize content
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Get approval from team members
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Schedule and publish posts
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Track performance and analytics
          </li>
        </ul>
      </div>
    </div>
  )
}

function SocialMediaStep() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  
  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷' },
    { id: 'facebook', name: 'Facebook', icon: '📘' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' }
  ]

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
        Connect Your Social Media
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Select the social media platforms you want to manage with ContentJoy.
      </p>
      
      <div className="space-y-3">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              selectedPlatforms.includes(platform.id)
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] bg-opacity-5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{platform.icon}</span>
                <span className="font-medium text-gray-900">{platform.name}</span>
              </div>
              {selectedPlatforms.includes(platform.id) && (
                <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function WorkflowStep() {
  const [approvalType, setApprovalType] = useState<'single' | 'multiple'>('single')
  const [autoPublish, setAutoPublish] = useState(false)

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
        Set Up Approval Workflow
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Configure how content approval works for your team.
      </p>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Approval Type</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="approvalType"
                value="single"
                checked={approvalType === 'single'}
                onChange={(e) => setApprovalType(e.target.value as 'single' | 'multiple')}
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <div>
                <div className="font-medium text-gray-900">Single Approval</div>
                <div className="text-sm text-gray-500">One person needs to approve content</div>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                name="approvalType"
                value="multiple"
                checked={approvalType === 'multiple'}
                onChange={(e) => setApprovalType(e.target.value as 'single' | 'multiple')}
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <div>
                <div className="font-medium text-gray-900">Multiple Approvals</div>
                <div className="text-sm text-gray-500">Multiple people need to approve content</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Publishing</h3>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={autoPublish}
              onChange={(e) => setAutoPublish(e.target.checked)}
              className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
            />
            <div>
              <div className="font-medium text-gray-900">Auto-publish approved content</div>
              <div className="text-sm text-gray-500">Automatically publish content once approved</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

function UploadStep() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-[var(--brand-primary)] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Upload Your First Content
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Learn how to upload and manage your content with ContentJoy.
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="font-semibold text-gray-900 mb-4">Upload Process:</h3>
        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <div className="font-medium text-gray-900">Upload Content</div>
              <div className="text-sm text-gray-600">Drag and drop or click to upload images, videos, or carousels</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="font-medium text-gray-900">Add Caption</div>
              <div className="text-sm text-gray-600">Write your post caption and add hashtags</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-[var(--brand-primary)] text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="font-medium text-gray-900">Submit for Approval</div>
              <div className="text-sm text-gray-600">Send to your team for review and approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompleteStep() {
  const { gymName } = useBranding()

  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        You&apos;re All Set!
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Your content approval system is ready to go. Start uploading content and managing your social media presence with {gymName || 'ContentJoy'}.
      </p>
      
      <div className="bg-green-50 rounded-lg p-6 max-w-md mx-auto mb-6">
        <h3 className="font-semibold text-green-900 mb-2">What&apos;s Next?</h3>
        <ul className="text-sm text-green-800 space-y-1 text-left">
          <li>• Upload your first piece of content</li>
          <li>• Invite team members to join</li>
          <li>• Set up your approval workflow</li>
          <li>• Start scheduling posts</li>
        </ul>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const { gymName } = useBranding()
  const router = useRouter()

  const currentStepData = onboardingSteps.find(step => step.id === currentStep)

  const nextStep = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      router.push(`/${gymName?.toLowerCase().replace(/\s+/g, '-')}`)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStepData?.content) {
      case 'WelcomeStep':
        return <WelcomeStep />
      case 'SocialMediaStep':
        return <SocialMediaStep />
      case 'WorkflowStep':
        return <WorkflowStep />
      case 'UploadStep':
        return <UploadStep />
      case 'CompleteStep':
        return <CompleteStep />
      default:
        return <WelcomeStep />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="text-sm text-gray-500">
              Step {currentStep} of {onboardingSteps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <ProgressBar 
            current={currentStep} 
            total={onboardingSteps.length} 
            goal={onboardingSteps.length} 
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-2xl mx-auto px-4">
          {renderStepContent()}
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <BrandedButton
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </BrandedButton>
            
            <div className="text-sm text-gray-500">
              {currentStep} of {onboardingSteps.length}
            </div>
            
            <BrandedButton
              onClick={nextStep}
            >
              {currentStep === onboardingSteps.length ? 'Get Started' : 'Next'}
            </BrandedButton>
          </div>
        </div>
      </div>
    </div>
  )
}
