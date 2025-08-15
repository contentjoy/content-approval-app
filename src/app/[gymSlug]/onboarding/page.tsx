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
  cta: string
  testimonial: string
  
  // Media - now store File objects locally
  whiteLogoFile: File | null
  blackLogoFile: File | null
  whiteLogoUrl: string
  blackLogoUrl: string
}

const steps = [
  { id: 1, title: 'Business Details', icon: Building },
  { id: 2, title: 'Brand Identity', icon: Palette },
  { id: 3, title: 'Audience & Services', icon: Users },
  { id: 4, title: 'Links & Socials', icon: LinkIcon },
  { id: 5, title: 'Marketing & Content', icon: Megaphone },
]

const brandStyles = [
  'F45',
  'Peloton',
  'Nike',
  'Orangetheory',
  'CrossFit HQ',
  'Barry\'s',
  'SoulCycle',
  'Equinox',
  'Gymshark',
  'Rumble Boxing'
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
    cta: '',
    testimonial: '',
    whiteLogoFile: null,
    blackLogoFile: null,
    whiteLogoUrl: '',
    blackLogoUrl: ''
  })

  // Load existing data if available
  useEffect(() => {
    const loadGymData = async () => {
      try {
        const storedGymId = localStorage.getItem('gym_id')
        
        if (storedGymId) {
          console.log('🔍 Loading existing gym data for ID:', storedGymId)
          setGymId(storedGymId)
          
          // Load existing gym data
          const { data: gym, error } = await supabase
            .from('gyms')
            .select('*')
            .eq('id', storedGymId)
            .single()

          if (error) {
            console.warn('⚠️ Failed to load existing gym data:', error)
            return
          }

          if (gym) {
            console.log('✅ Loaded existing gym data:', gym['Gym Name'])
            setFormData(prev => ({
              ...prev,
              firstName: gym['First name'] || '',
              lastName: gym['Last name'] || '',
              email: gym['Email'] || '',
              businessName: gym['Gym Name'] || '',
              brandColor: gym['Primary color'] || '#000000',
              whiteLogoUrl: (gym as any)['White Logo URL'] || '',
              blackLogoUrl: (gym as any)['Black Logo URL'] || ''
            }))
          }
        } else {
          console.log('ℹ️ No stored gym ID found, starting fresh onboarding')
        }
      } catch (error) {
        console.error('❌ Error loading gym data:', error)
      }
    }

    // Only load data if we're on the onboarding page and have a gym slug
    if (gymSlug) {
      loadGymData()
    }
  }, [gymSlug])

  const updateFormData = (field: keyof FormData, value: string | string[] | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // URL validation functions
  const validateUrl = (url: string, fieldName: string): boolean => {
    if (!url.trim()) return false
    
    // Check if URL starts with https://www.
    if (!url.startsWith('https://www.')) {
      toast.error(`${fieldName} must start with "https://www."`)
      // Add shake effect to the form
      document.querySelector('.onboarding-form')?.classList.add('shake')
      setTimeout(() => {
        document.querySelector('.onboarding-form')?.classList.remove('shake')
      }, 600)
      return false
    }
    
    try {
      new URL(url)
      return true
    } catch {
      toast.error(`${fieldName} must be a valid URL`)
      // Add shake effect to the form
      document.querySelector('.onboarding-form')?.classList.add('shake')
      setTimeout(() => {
        document.querySelector('.onboarding-form')?.classList.remove('shake')
      }, 600)
      return false
    }
  }

  const validateRequiredField = (value: string, fieldName: string): boolean => {
    if (!value.trim()) {
      toast.error(`${fieldName} is required`)
      // Add shake effect to the form
      document.querySelector('.onboarding-form')?.classList.add('shake')
      setTimeout(() => {
        document.querySelector('.onboarding-form')?.classList.remove('shake')
      }, 600)
      return false
    }
    return true
  }

  const nextStep = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return (
          validateRequiredField(formData.firstName, 'First Name') &&
          validateRequiredField(formData.lastName, 'Last Name') &&
          validateRequiredField(formData.phone, 'Phone')
        )
      case 2:
        return (
          validateRequiredField(formData.brandColor, 'Brand Color') &&
          validateRequiredField(formData.brandStyle, 'Brand Style')
        )
      case 3:
        return (
          validateRequiredField(formData.audience, 'Target Audience') &&
          validateRequiredField(formData.services, 'Services') &&
          validateRequiredField(formData.results, 'Desired Results')
        )
      case 4:
        return (
          validateRequiredField(formData.website, 'Website') &&
          validateRequiredField(formData.instagramUrl, 'Instagram URL') &&
          validateRequiredField(formData.googleMapUrl, 'Google Maps URL') &&
          validateUrl(formData.website, 'Website') &&
          validateUrl(formData.instagramUrl, 'Instagram URL') &&
          validateUrl(formData.googleMapUrl, 'Google Maps URL')
        )
      case 5:
        return (
          validateRequiredField(formData.cta, 'Call to Action') &&
          validateRequiredField(formData.testimonial, 'Testimonial')
        )
      default:
        return true
    }
  }

  const handleSubmit = async () => {
    if (!gymId) return

    setIsSubmitting(true)

    try {
      // First, fetch the gym data to get email and gym name
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select('"Gym Name", "Email"')
        .eq('id', gymId)
        .single()

      if (gymError) {
        console.error('Failed to fetch gym data:', gymError)
        throw new Error('Failed to fetch gym data')
      }

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
          'Primary offer': formData.cta,
          'Client Info': formData.testimonial,
          'White Logo URL': formData.whiteLogoUrl,
          'Black Logo URL': formData.blackLogoUrl,
          'Status': 'active'
        })
        .eq('id', gymId)

      if (updateError) throw updateError

      // Upload logos to Google Drive if files were selected
      let whiteLogoUrl = formData.whiteLogoUrl
      let blackLogoUrl = formData.blackLogoUrl
      const logoUploadErrors: string[] = []

      if (formData.whiteLogoFile || formData.blackLogoFile) {
        console.log('📤 Uploading logos to Google Drive...')
        
        try {
          // Upload white logo if selected
          if (formData.whiteLogoFile) {
            console.log('📤 Uploading white logo:', formData.whiteLogoFile.name)
            const whiteLogoResponse = await fetch('/api/upload-logos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                files: [{
                  name: `${gymSlug} - white logo`,
                  type: formData.whiteLogoFile.type,
                  size: formData.whiteLogoFile.size,
                  data: await formData.whiteLogoFile.arrayBuffer().then(buffer => Buffer.from(buffer).toString('base64')),
                  isLogo: true,
                  logoType: 'white',
                  gymName: gymSlug
                }],
                gymSlug: gymSlug,
                gymName: gymSlug
              })
            })

            if (whiteLogoResponse.ok) {
              const result = await whiteLogoResponse.json()
              if (result.results && result.results[0]?.fileId) {
                whiteLogoUrl = `https://drive.google.com/file/d/${result.results[0].fileId}/view`
                console.log('✅ White logo uploaded successfully')
              } else {
                throw new Error('No file ID returned from white logo upload')
              }
            } else {
              const errorText = await whiteLogoResponse.text()
              console.error('❌ White logo upload failed:', whiteLogoResponse.status, errorText)
              throw new Error(`White logo upload failed: ${whiteLogoResponse.status} - ${errorText}`)
            }
          }

          // Upload black logo if selected
          if (formData.blackLogoFile) {
            console.log('📤 Uploading black logo:', formData.blackLogoFile.name)
            const blackLogoResponse = await fetch('/api/upload-logos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                files: [{
                  name: `${gymSlug} - black logo`,
                  type: formData.blackLogoFile.type,
                  size: formData.blackLogoFile.size,
                  data: await formData.blackLogoFile.arrayBuffer().then(buffer => Buffer.from(buffer).toString('base64')),
                  isLogo: true,
                  logoType: 'black',
                  gymName: gymSlug
                }],
                gymSlug: gymSlug,
                gymName: gymSlug
              })
            })

            if (blackLogoResponse.ok) {
              const result = await blackLogoResponse.json()
              if (result.results && result.results[0]?.fileId) {
                blackLogoUrl = `https://drive.google.com/file/d/${result.results[0].fileId}/view`
                console.log('✅ Black logo uploaded successfully')
              } else {
                throw new Error('No file ID returned from black logo upload')
              }
            } else {
              const errorText = await blackLogoResponse.text()
              console.error('❌ Black logo upload failed:', blackLogoResponse.status, errorText)
              throw new Error(`Black logo upload failed: ${blackLogoResponse.status} - ${errorText}`)
            }
          }

          // Update the database with the new logo URLs if they changed
          if (whiteLogoUrl !== formData.whiteLogoUrl || blackLogoUrl !== formData.blackLogoUrl) {
            console.log('💾 Updating database with new logo URLs')
            const { error: logoUpdateError } = await supabase
              .from('gyms')
              .update({
                'White Logo URL': whiteLogoUrl,
                'Black Logo URL': blackLogoUrl
              })
              .eq('id', gymId)

            if (logoUpdateError) {
              console.warn('⚠️ Failed to update logo URLs in database:', logoUpdateError)
              logoUploadErrors.push('Failed to update logo URLs in database')
            } else {
              console.log('✅ Logo URLs updated in database successfully')
            }
          }

        } catch (logoError) {
          console.error('❌ Logo upload error:', logoError)
          const errorMessage = logoError instanceof Error ? logoError.message : 'Unknown logo upload error'
          logoUploadErrors.push(errorMessage)
          
          // Don't fail the onboarding if logo upload fails, but log the error
          console.warn('⚠️ Logo upload failed, continuing with onboarding:', errorMessage)
        }
      }

      // If there were logo upload errors, log them but continue
      if (logoUploadErrors.length > 0) {
        console.warn('⚠️ Logo upload had issues:', logoUploadErrors)
      }

      // Send data to onboarding webhook with gym name and email
      const webhookData = {
        // Gym identification
        gym_id: gymId,
        gym_name: gymData['Gym Name'],
        gym_email: gymData['Email'],
        
        // Onboarding form data
        business_details: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          website: formData.website,
          city: formData.city,
          address: formData.address
        },
        
        brand_identity: {
          brand_color: formData.brandColor,
          brand_style: formData.brandStyle
        },
        
        audience_services: {
          target_audience: formData.audience,
          services: formData.services,
          desired_results: formData.results
        },
        
        links_socials: {
          google_map_url: formData.googleMapUrl,
          instagram_url: formData.instagramUrl
        },
        
        marketing_content: {
          primary_cta: formData.cta,
          testimonial: formData.testimonial
        },
        
        media: {
          white_logo_url: whiteLogoUrl,
          black_logo_url: blackLogoUrl
        },
        
        // Metadata
        submitted_at: new Date().toISOString(),
        gym_slug: gymSlug
      }

      // Send to test webhook
      const webhookUrl = process.env.ONBOARDING_TEST_WEBHOOK || 
                        process.env.ONBOARDING_WEBHOOK_URL || 
                        'https://contentjoy.app.n8n.cloud/webhook-test/156ef9a5-0ae7-4e65-acc1-a27aa533d90a'
      
      try {
        console.log('🚀 Sending onboarding data to webhook:', webhookData)
        console.log('🌐 Webhook URL:', webhookUrl)
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'ContentJoy-Onboarding/1.0'
          },
          body: JSON.stringify(webhookData)
        })

        if (!webhookResponse.ok) {
          const responseText = await webhookResponse.text()
          console.warn('⚠️ Webhook request failed:', webhookResponse.status, webhookResponse.statusText)
          console.warn('📝 Response text:', responseText)
          
          // If it's a 404, the webhook might not be configured for POST
          if (webhookResponse.status === 404) {
            console.warn('🔍 Webhook returned 404 - endpoint might not be configured for POST requests')
            console.warn('💡 Try checking your n8n webhook configuration')
          }
        } else {
          console.log('✅ Webhook data sent successfully')
          console.log('📊 Response status:', webhookResponse.status)
        }
      } catch (webhookError) {
        console.error('❌ Webhook error:', webhookError)
        // Don't fail the onboarding if webhook fails
      }

      // Create Ayrshare profile for this gym
      try {
        setCreatingProfile(true)
        console.log('🔑 Attempting to create Ayrshare profile for gym:', gymSlug)
        console.log('🔑 Gym ID:', gymId)
        console.log('🔑 Gym Data:', gymData)
        
        // Use gym slug as the profile name, fallback to gym name if needed
        const profileName = gymSlug || gymData['Gym Name'] || 'gym'
        console.log('🔑 Using profile name:', profileName)
        
        console.log('🔑 Making API call to /api/ayrshare/create-profile...')
        const r = await fetch('/api/ayrshare/create-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gymName: profileName })
        })
        
        console.log('🔑 API response status:', r.status)
        console.log('🔑 API response headers:', Object.fromEntries(r.headers.entries()))
        
        if (!r.ok) {
          const errorText = await r.text()
          console.error('❌ Ayrshare profile creation failed:', r.status, errorText)
          console.error('🔍 Full error response:', errorText)
          throw new Error(`Failed to create profile: ${r.status} - ${errorText}`)
        }
        
        const responseData = await r.json()
        console.log('🔑 API response data:', responseData)
        
        const { profileKey } = responseData
        if (!profileKey) {
          console.error('❌ No profileKey in response data:', responseData)
          throw new Error('No profileKey returned from Ayrshare API')
        }
        
        console.log('✅ Ayrshare profile created successfully:', profileKey)
        
        setProfileKey(profileKey)
        
        // Save profile key to the profile_key column in gyms table
        console.log('💾 Saving profile key to database...')
        const save = await updateGymProfileKey(gymId, profileKey)
        if (!save.success) {
          console.error('❌ Failed to save profile key to database:', save.error)
          throw new Error(`Failed to save profile key: ${save.error}`)
        }
        
        console.log('✅ Profile key saved to database successfully in profile_key column')
        toast.success('Profile created. You can now connect social accounts.')
      } catch (err: any) {
        console.error('❌ Ayrshare profile create failed:', err)
        console.error('🔍 Error details:', {
          message: err.message,
          status: err.status,
          details: err.details,
          stack: err.stack
        })
        
        // Show more specific error message
        if (err.message?.includes('AYRSHARE_API_KEY is not configured')) {
          toast.error('Ayrshare API not configured. Please contact support.')
        } else if (err.message?.includes('Failed to create profile')) {
          toast.error('Failed to create social profile. Please try again later.')
        } else if (err.message?.includes('No profileKey returned')) {
          toast.error('Profile creation failed - no profile key returned.')
        } else {
          toast.error('Failed to create social profile: ' + (err.message || 'Unknown error'))
        }
        
        // Continue with onboarding even if profile creation fails
        console.log('⚠️ Continuing onboarding without Ayrshare profile')
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
        return formData.cta && formData.testimonial
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
                <label className="block text-sm font-medium text-text mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Website <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="https://www.yourgym.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                  placeholder="New York"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="123 Main St, New York, NY 10001"
                required
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            {/* Logo Uploads */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Upload White Logo</label>
              <LogoUploader
                currentUrl={formData.whiteLogoUrl}
                onFileSelected={(file, logoType) => updateFormData('whiteLogoFile', file)}
                logoType="white"
                gymName={gymSlug}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">Upload Black Logo</label>
              <LogoUploader
                currentUrl={formData.blackLogoUrl}
                onFileSelected={(file, logoType) => updateFormData('blackLogoFile', file)}
                logoType="black"
                gymName={gymSlug}
              />
            </div>

            <div className="text-sm text-text-secondary bg-card-bg p-4 rounded-lg border border-card-border">
              <p>Upload the transparent black and white logo for your business that will appear in your social media posts.</p>
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
              <label className="block text-sm font-medium text-text mb-2">
                Which brand sounds most like you? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.brandStyle}
                onChange={(e) => updateFormData('brandStyle', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                required
              >
                <option value="">Select an option</option>
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
              <label className="block text-sm font-medium text-text mb-2">
                Target Audience <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.audience}
                onChange={(e) => updateFormData('audience', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="Describe your ideal clients and target audience..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Services Offered <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.services}
                onChange={(e) => updateFormData('services', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="List your main services and programs..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Clients desired result <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.results}
                onChange={(e) => updateFormData('results', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="Share client success stories and achievements..."
                required
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Google Maps URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.googleMapUrl}
                onChange={(e) => updateFormData('googleMapUrl', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="https://www.google.com/maps/..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Instagram URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => updateFormData('instagramUrl', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="https://www.instagram.com/yourgym"
                required
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Call to Action <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cta}
                onChange={(e) => updateFormData('cta', e.target.value)}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="Join us today and transform your life!"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Client Testimonial <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.testimonial}
                onChange={(e) => updateFormData('testimonial', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-card-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-text"
                placeholder="Share a powerful client testimonial..."
                required
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
      <div className="max-w-4xl mx-auto onboarding-form">
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
                    body: JSON.stringify({ profileKey, gymId, platform: 'instagram' })
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

// Logo uploader that stores files locally for later upload
function LogoUploader({ 
  currentUrl, 
  onFileSelected, 
  logoType, 
  gymName 
}: { 
  currentUrl: string; 
  onFileSelected: (file: File, logoType: 'white' | 'black') => void; 
  logoType: 'white' | 'black'; 
  gymName: string;
}) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFiles = (file: File) => {
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }
    
    setSelectedFile(file)
    onFileSelected(file, logoType)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFiles(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    onFileSelected(null as any, logoType)
  }

  return (
    <div>
      {(currentUrl || selectedFile) && (
        <div className="mb-3 flex items-center space-x-3">
          <img 
            src={selectedFile ? URL.createObjectURL(selectedFile) : currentUrl} 
            alt={`${logoType} logo`} 
            className="w-16 h-16 rounded-lg object-contain border border-card-border bg-white" 
          />
          <div className="flex-1">
            <span className="text-sm text-text-secondary block">
              {selectedFile ? 'Selected' : 'Current'} {logoType} logo
            </span>
            {selectedFile && (
              <span className="text-xs text-text-secondary block">
                {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </span>
            )}
          </div>
          {selectedFile && (
            <button
              onClick={removeFile}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 ${dragOver ? 'border-primary' : 'border-dashed border-card-border'} rounded-lg p-4 text-center bg-card-bg`}
      >
        <p className="text-sm text-text mb-2">Drag and drop a {logoType} logo here, or</p>
        <label className="inline-block">
          <span className="px-3 py-2 rounded-lg bg-primary text-white cursor-pointer">Choose file</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFiles(file)
            }}
          />
        </label>
        <p className="text-xs text-text-secondary mt-2">PNG, JPG, GIF up to 10MB</p>
      </div>
    </div>
  )
}