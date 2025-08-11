'use client'

import React, { useState, useEffect, DragEvent } from 'react'
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
import { updateGymProfileKey } from '@/lib/database'
import toast from 'react-hot-toast'

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
  
  // Media
  profileImageUrl: string
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
  const [profileKey, setProfileKey] = useState<string | null>(null)
  const [creatingProfile, setCreatingProfile] = useState(false)
  
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
    ,
    profileImageUrl: ''
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
            brandColor: gym['Primary color'] || '#000000',
            profileImageUrl: gym['Profile Image URL'] || ''
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
          'Social Platforms': formData.socialPlatforms,
          'Primary offer': formData.cta,
          'Client Info': formData.testimonial,
          'Profile Image URL': formData.profileImageUrl,
          'Status': 'active'
        })
        .eq('id', gymId)

      if (updateError) throw updateError

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

      // Create Ayrshare profile for this gym
      try {
        setCreatingProfile(true)
        const r = await fetch('/api/ayrshare/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymName: formData.instagramUrl ? new URL(formData.instagramUrl).pathname.replace(/\//g, '') || gymSlug : gymSlug })
        })
        if (!r.ok) throw new Error(await r.text())
        const { profileKey } = await r.json()
        setProfileKey(profileKey)
        const save = await updateGymProfileKey(gymId, profileKey)
        if (!save.success) throw new Error(save.error || 'Failed to save profileKey')
        toast.success('Profile created. You can now connect social accounts.')
      } catch (err: any) {
        console.error('Ayrshare profile create failed:', err)
        toast.error('Failed to create social profile')
      } finally {
        setCreatingProfile(false)
      }
      
      // Show connect step
      router.push(`/${gymSlug}/onboarding/connect`)
      
    } catch (error) {
      console.error('Onboarding submission failed:', error)
      toast.error('Failed to save onboarding data. Please try again.')
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
            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Profile Image</label>
              <ProfileImageUploader
                currentUrl={formData.profileImageUrl}
                onUploaded={(url) => updateFormData('profileImageUrl', url)}
              />
            </div>

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
        {/* Progress bar (mobile-friendly) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-secondary">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-text-secondary">{Math.round((currentStep/steps.length)*100)}%</span>
          </div>
          <div className="w-full h-2 rounded-md bg-[var(--surface)] border border-border overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(currentStep/steps.length)*100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-card-bg border border-card-border rounded-md p-8 mb-8"
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

        {/* Connect Social Account CTA (after submit or if profile exists) */}
        {(profileKey || creatingProfile) && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={async () => {
                try {
                  if (!profileKey) return
                  const r = await fetch('/api/ayrshare/generate-jwt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileKey })
                  })
                  if (!r.ok) throw new Error(await r.text())
                  const { url } = await r.json()
                  if (!url) throw new Error('No URL returned')
                  window.open(url, '_blank')
                } catch (err: any) {
                  console.error('Generate JWT failed:', err)
                  toast.error('Failed to start social connection')
                }
              }}
              className="px-6 py-3 rounded-lg bg-[var(--brand-primary)] text-white hover:opacity-90 disabled:opacity-50"
              disabled={creatingProfile}
            >
              {creatingProfile ? 'Preparing…' : 'Connect Social Account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple uploader that saves a file to Supabase Storage and returns a public URL
function ProfileImageUploader({ currentUrl, onUploaded }: { currentUrl: string; onUploaded: (url: string) => void }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (file: File) => {
    if (!file) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `profile_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Use a dedicated bucket named "profile-images"
      const { error: uploadError } = await supabase.storage.from('profile-images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('profile-images').getPublicUrl(filePath)
      const url = publicUrlData.publicUrl
      onUploaded(url)
    } catch (e: any) {
      console.error('Supabase upload failed:', e)
      alert(`Failed to upload image: ${e?.message || 'Please try again.'}`)
    } finally {
      setUploading(false)
      setDragOver(false)
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFiles(file)
  }

  return (
    <div>
      {currentUrl && (
        <div className="mb-3 flex items-center space-x-3">
          <img src={currentUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-card-border" />
          <span className="text-sm text-text-secondary">Current profile image</span>
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 ${dragOver ? 'border-primary' : 'border-dashed border-card-border'} rounded-lg p-4 text-center bg-card-bg`}
      >
        <p className="text-sm text-text mb-2">Drag and drop an image here, or</p>
        <label className="inline-block">
          <span className="px-3 py-2 rounded-lg bg-primary text-white cursor-pointer">Choose file</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFiles(file)
            }}
          />
        </label>
        {uploading && <p className="text-xs text-text-secondary mt-2">Uploading…</p>}
      </div>
    </div>
  )
}