import React from 'react'
import { FormData } from '../types'
import { LogoUploader } from '../logo-uploader'

interface StepContentProps {
  currentStep: number
  formData: FormData
  updateFormData: (field: keyof FormData, value: string | string[] | File | null) => void
  gymSlug: string
  brandStyles: string[]
}

export function StepContent({ currentStep, formData, updateFormData, gymSlug, brandStyles }: StepContentProps) {
  switch (currentStep) {
    case 1:
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => updateFormData('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Last Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => updateFormData('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Website <span className="text-destructive">*</span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => updateFormData('website', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="https://www.yourgym.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                City <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="New York"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Address <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => updateFormData('address', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
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
            <label className="block text-sm font-medium text-foreground mb-2">Upload White Logo</label>
            <LogoUploader
              currentUrl={formData.whiteLogoUrl}
              onFileSelected={(file) => updateFormData('whiteLogoFile', file)}
              logoType="white"
              gymName={gymSlug}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Upload Black Logo</label>
            <LogoUploader
              currentUrl={formData.blackLogoUrl}
              onFileSelected={(file) => updateFormData('blackLogoFile', file)}
              logoType="black"
              gymName={gymSlug}
            />
          </div>

          <div className="text-sm text-muted-foreground bg-card p-4 rounded-lg border border-border">
            <p>Upload the transparent black and white logo for your business that will appear in your social media posts.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Brand Color</label>
            <div className="flex items-center space-x-4">
              <input
                type="color"
                value={formData.brandColor}
                onChange={(e) => updateFormData('brandColor', e.target.value)}
                className="w-16 h-12 border border-input rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.brandColor}
                onChange={(e) => updateFormData('brandColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Which brand sounds most like you? <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.brandStyle}
              onChange={(e) => updateFormData('brandStyle', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground"
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Audience <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.audience}
              onChange={(e) => updateFormData('audience', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Describe your ideal clients and target audience..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Services Offered <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.services}
              onChange={(e) => updateFormData('services', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="List your main services and programs..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Clients desired result <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.results}
              onChange={(e) => updateFormData('results', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Google Maps URL <span className="text-destructive">*</span>
            </label>
            <input
              type="url"
              value={formData.googleMapUrl}
              onChange={(e) => updateFormData('googleMapUrl', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="https://www.google.com/maps/..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Instagram URL <span className="text-destructive">*</span>
            </label>
            <input
              type="url"
              value={formData.instagramUrl}
              onChange={(e) => updateFormData('instagramUrl', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Call to Action <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.cta}
              onChange={(e) => updateFormData('cta', e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
              placeholder="Join us today and transform your life!"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Client Testimonial <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.testimonial}
              onChange={(e) => updateFormData('testimonial', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-input bg-background text-foreground placeholder:text-muted-foreground"
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
