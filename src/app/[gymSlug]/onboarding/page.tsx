'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Building, 
  Palette, 
  Users, 
  Link as LinkIcon,
  Megaphone,
  Loader
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FormData {
  // Business Details
  firstName: string
  lastName: string
  phone: string
  website: string
  city: string
  address: string
  
  // Brand Identity
  brandColor: string
  brandStyle: string
  
  // Audience & Services
  audience: string
  services: string
  results: string
  
  // Links & Socials
  googleMapUrl: string
  instagramUrl: string
  
  // Marketing & Content
  socialPlatforms: string[]
  cta: string
  testimonial: string
}

const steps = [
  { id: 1, title: 'Business Details', icon: Building },
  { id: 2, title: 'Brand Identity', icon: Palette },
  { id: 3, title: 'Audience & Services', icon: Users },
  { id: 4, title: 'Links & Socials', icon: LinkIcon },
  { id: 5, title: 'Marketing & Content', icon: Megaphone },
]

const brandStyles = [
  'Modern & Minimalist',
  'Bold & Energetic',
  'Professional & Corporate',
  'Friendly & Approachable',
  'Luxury & Premium',
  'Creative & Artistic'
]

const socialPlatforms = [
  'Facebook',
  'Instagram',
  'Twitter',
  'LinkedIn',
  'TikTok',
  'YouTube'
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gymId, setGymId] = useState<string | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const gymSlug = params.gymSlug as string

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    website: '',
    city: '',
    address: '',
    brandColor: '#000000',
    brandStyle: '',
    audience: '',
    services: '',
    results: '',
    googleMapUrl: '',
    instagramUrl: '',
    socialPlatforms: [],
    cta: '',
    testimonial: ''
  })

  // Load existing data if available
  useEffect(() => {
    const loadGymData = async () => {
      const storedGymId = localStorage.getItem('gym_id')
      
      if (storedGymId) {
        setGymId(storedGymId)
        
        // Load existing gym data
        const { data: gym } = await supabase
          .from('gyms')
          .select('*')
          .eq('id', storedGymId)
          .single()

        if (gym) {
          setFormData(prev => ({
            ...prev,
            firstName: gym['First name'] || '',
            lastName: gym['Last name'] || '',
            email: gym['Email'] || '',
            businessName: gym['Gym Name'] || '',
            brandColor: gym['Primary color'] || '#000000'
          }))
        }
      }
    }

    loadGymData()
  }, [])

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!gymId) return

    setIsSubmitting(true)

    try {
      // Update gym record with onboarding data
      const { error: updateError } = await supabase
        .from('gyms')
        .update({
          'First name': formData.firstName,
          'Last name': formData.lastName,
          'Phone': formData.phone,
          'Website': formData.website,
          'City': formData.city,
          'Address': formData.address,
          'Primary color': formData.brandColor,
          'Brand Profile': formData.brandStyle,
          'Target Demographic': formData.audience,
          'Offerings': formData.services,
          'Clients Desired Result': formData.results,
          'Google Map URL': formData.googleMapUrl,
          'Instagram URL': formData.instagramUrl,
          'Social Platforms': formData.socialPlatforms.join(', '),
          'Primary offer': formData.cta,
          'Client Info': formData.testimonial,
          'Status': 'active'
        })
        .eq('id', gymId)

      if (updateError) {
        throw updateError
      }

      // Send data to onboarding webhook
      const webhookData = {
        id: gymId,
        ...formData
      }

      const webhookUrl = process.env.ONBOARDING_WEBHOOK_URL || process.env.NEXT_PUBLIC_ONBOARDING_WEBHOOK_URL
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        })
      }

      // Redirect to social connection
      router.push(`/${gymSlug}/onboarding/connect`)
      
    } catch (error) {
      console.error('Onboarding submission failed:', error)
      alert('Failed to save onboarding data. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.phone
      case 2:
        return formData.brandColor && formData.brandStyle
      case 3:
        return formData.audience && formData.services
      case 4:
        return true // Optional fields
      case 5:
        return formData.socialPlatforms.length > 0
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="https://yourgym.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="New York"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="123 Main St, New York, NY 10001"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Brand Color</label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={formData.brandColor}
                  onChange={(e) => updateFormData('brandColor', e.target.value)}
                  className="w-16 h-12 border border-card-border rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.brandColor}
                  onChange={(e) => updateFormData('brandColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Brand Style</label>
              <select
                value={formData.brandStyle}
                onChange={(e) => updateFormData('brandStyle', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
              >
                <option value="">Select your brand style</option>
                {brandStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Target Audience</label>
              <textarea
                value={formData.audience}
                onChange={(e) => updateFormData('audience', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="Describe your ideal clients and target audience..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Services Offered</label>
              <textarea
                value={formData.services}
                onChange={(e) => updateFormData('services', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="List your main services and programs..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Clients desired result</label>
              <textarea
                value={formData.results}
                onChange={(e) => updateFormData('results', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="Share client success stories and achievements..."
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Google Maps URL</label>
              <input
                type="url"
                value={formData.googleMapUrl}
                onChange={(e) => updateFormData('googleMapUrl', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Instagram URL</label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => updateFormData('instagramUrl', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="https://instagram.com/yourgym"
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-4">Social Media Platforms</label>
              <div className="grid grid-cols-2 gap-3">
                {socialPlatforms.map(platform => (
                  <label key={platform} className="flex items-center space-x-3 p-3 border border-card-border rounded-lg cursor-pointer hover:bg-card-bg">
                    <input
                      type="checkbox"
                      checked={formData.socialPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFormData('socialPlatforms', [...formData.socialPlatforms, platform])
                        } else {
                          updateFormData('socialPlatforms', formData.socialPlatforms.filter(p => p !== platform))
                        }
                      }}
                      className="w-4 h-4 text-primary border-card-border rounded focus:ring-primary"
                    />
                    <span className="text-text">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Call to Action</label>
              <input
                type="text"
                value={formData.cta}
                onChange={(e) => updateFormData('cta', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="Join us today and transform your life!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Client Testimonial</label>
              <textarea
                value={formData.testimonial}
                onChange={(e) => updateFormData('testimonial', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="Share a powerful client testimonial..."
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                  ${currentStep >= step.id ? 'bg-primary text-white' : 'bg-card-bg text-text-secondary border border-card-border'}
                `}>
                  {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    h-0.5 w-16 mx-2 transition-colors
                    ${currentStep > step.id ? 'bg-primary' : 'bg-card-border'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.id} className="text-xs text-text-secondary text-center w-10">
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-card-bg border border-card-border rounded-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4">
              {React.createElement(steps[currentStep - 1].icon, { className: "w-6 h-6 text-white" })}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text">{steps[currentStep - 1].title}</h2>
              <p className="text-text-secondary">Step {currentStep} of {steps.length}</p>
            </div>
          </div>

          {renderStepContent()}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 text-text-secondary hover:text-text disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          {currentStep === steps.length ? (
            <button
              onClick={handleSubmit}
              disabled={!isStepValid() || isSubmitting}
              className="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                <>
                  Complete Setup
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}