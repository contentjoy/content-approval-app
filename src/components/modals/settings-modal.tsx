'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/i, 'Use a HEX color (e.g., #20B8CD)').optional().or(z.literal('')),
  brandChoice: z.string().optional().or(z.literal('')),
  cityAddress: z.string().optional().or(z.literal('')),
  socialHandle: z.string().optional().or(z.literal('')),
  firstName: z.string().optional().or(z.literal('')),
  lastName: z.string().optional().or(z.literal('')),
  brandProfile: z.string().optional().or(z.literal('')),
  writingStyle: z.string().optional().or(z.literal('')),
  clientInfo: z.string().optional().or(z.literal('')),
  primaryOffer: z.string().optional().or(z.literal('')),
  targetDemographic: z.string().optional().or(z.literal('')),
  clientsDesiredResult: z.string().optional().or(z.literal('')),
  offerings: z.string().optional().or(z.literal('')),
  localHashtags: z.string().optional().or(z.literal('')),
})

export type SettingsModalData = z.infer<typeof schema>

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  gymId: string
  // Optional initial values; will be overridden by DB fetch when modal opens
  initial?: Partial<SettingsModalData>
  onSaved?: (data: SettingsModalData) => void
}

type AyrshareProfiles = Record<string, { profile_key?: string; connected_at?: string }>

export function SettingsModal({ isOpen, onClose, gymId, initial, onSaved }: SettingsModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SettingsModalData>({
    resolver: zodResolver(schema),
    defaultValues: initial || {}
  })

  const [profileKey, setProfileKey] = useState<string | null>(null)
  const [ayrshareProfiles, setAyrshareProfiles] = useState<AyrshareProfiles>({})
  const connectedPlatforms = useMemo(() => Object.keys(ayrshareProfiles || {}), [ayrshareProfiles])

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      const { data, error } = await supabase
        .from('gyms')
        .select('profile_key, ayrshare_profiles, "Brand Choice", "Primary Color", "City Address", "Social handle", "Email", "First name", "Last name", "Brand Profile", "Writing Style", "Client Info", "Primary offer", "Target Demographic", "Clients Desired Result", "Offerings", "Local Hashtags"')
        .eq('id', gymId)
        .single()
      if (error) {
        toast.error(`Failed to load settings: ${error.message}`)
        return
      }
      setProfileKey(data?.profile_key || null)
      setAyrshareProfiles((data as any)?.ayrshare_profiles || {})
      reset({
        email: data?.Email || '',
        primaryColor: data?.['Primary Color'] || '',
        brandChoice: data?.['Brand Choice'] || '',
        cityAddress: data?.['City Address'] || '',
        socialHandle: data?.['Social handle'] || '',
        firstName: data?.['First name'] || '',
        lastName: data?.['Last name'] || '',
        brandProfile: data?.['Brand Profile'] || '',
        writingStyle: data?.['Writing Style'] || '',
        clientInfo: data?.['Client Info'] || '',
        primaryOffer: data?.['Primary offer'] || '',
        targetDemographic: data?.['Target Demographic'] || '',
        clientsDesiredResult: data?.['Clients Desired Result'] || '',
        offerings: data?.['Offerings'] || '',
        localHashtags: data?.['Local Hashtags'] || '',
      })
    })()
  }, [isOpen, gymId, reset])

  const onSubmit = async (values: SettingsModalData) => {
    const update: Record<string, any> = {
      'Email': values.email ?? null,
      'Primary Color': values.primaryColor ?? null,
      'Brand Choice': values.brandChoice ?? null,
      'City Address': values.cityAddress ?? null,
      'Social handle': values.socialHandle ?? null,
      'First name': values.firstName ?? null,
      'Last name': values.lastName ?? null,
      'Brand Profile': values.brandProfile ?? null,
      'Writing Style': values.writingStyle ?? null,
      'Client Info': values.clientInfo ?? null,
      'Primary offer': values.primaryOffer ?? null,
      'Target Demographic': values.targetDemographic ?? null,
      'Clients Desired Result': values.clientsDesiredResult ?? null,
      'Offerings': values.offerings ?? null,
      'Local Hashtags': values.localHashtags ?? null,
    }

    const { error } = await supabase
      .from('gyms')
      .update(update)
      .eq('id', gymId)

    if (error) {
      toast.error(`Failed to update settings: ${error.message}`)
      return
    }
    toast.success('Settings saved')
    onSaved?.(values)
    onClose()
  }

  async function openAyrshareManage(platform?: string) {
    try {
      if (!profileKey) {
        toast.error('Profile key missing. Complete onboarding first.')
        return
      }
      const res = await fetch('/api/ayrshare/generate-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileKey, gymId, platform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate URL')

      const w = 920, h = 700
      const left = Math.max(0, Math.floor((window.screen.width - w) / 2))
      const top = Math.max(0, Math.floor((window.screen.height - h) / 2))
      const popup = window.open(data.url, 'ayrshare_connect', `width=${w},height=${h},left=${left},top=${top}`)
      if (!popup) return

      const timer = setInterval(async () => {
        if (popup.closed) {
          clearInterval(timer)
          // sync profiles after close
          await fetch('/api/ayrshare/sync-profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gymId, profileKey }),
          })
          // refresh local state
          const { data: g } = await supabase
            .from('gyms')
            .select('ayrshare_profiles')
            .eq('id', gymId)
            .single()
          setAyrshareProfiles((g as any)?.ayrshare_profiles || {})
        }
      }, 600)
    } catch (e: any) {
      toast.error(e.message || 'Failed to open social connect')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings" size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Email</label>
            <input type="email" {...register('email')} className="input-base" placeholder="owner@example.com" />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" {...register('primaryColor')} className="w-14 h-10 border border-border rounded-md" />
              <input type="text" {...register('primaryColor')} className="input-base" placeholder="#20B8CD" />
            </div>
            {errors.primaryColor && <p className="text-sm text-destructive mt-1">{errors.primaryColor.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-2">Brand Choice</label>
            <input type="text" {...register('brandChoice')} className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">City Address</label>
            <input type="text" {...register('cityAddress')} className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Social handle</label>
            <input type="text" {...register('socialHandle')} className="input-base" placeholder="@yourgym" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">First name</label>
              <input type="text" {...register('firstName')} className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Last name</label>
              <input type="text" {...register('lastName')} className="input-base" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Brand Profile</label>
            <textarea {...register('brandProfile')} className="input-base" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Writing Style</label>
            <textarea {...register('writingStyle')} className="input-base" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Client Info</label>
            <textarea {...register('clientInfo')} className="input-base" rows={4} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Primary offer</label>
            <input type="text" {...register('primaryOffer')} className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Target Demographic</label>
            <input type="text" {...register('targetDemographic')} className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Clients Desired Result</label>
            <input type="text" {...register('clientsDesiredResult')} className="input-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Offerings</label>
            <textarea {...register('offerings')} className="input-base" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Local Hashtags</label>
            <textarea {...register('localHashtags')} className="input-base" rows={3} placeholder="#fitness #gym" />
          </div>
        </div>

        {/* Social platforms */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Social Platforms</h3>
            <BrandedButton type="button" variant="outline" onClick={() => openAyrshareManage()}>Manage Connections</BrandedButton>
          </div>
          <div className="flex flex-wrap gap-2">
            {connectedPlatforms.length === 0 && (
              <span className="text-sm text-[var(--muted-text)]">No connected accounts</span>
            )}
            {connectedPlatforms.map((p) => (
              <div key={p} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm">
                <span className="capitalize">{p}</span>
                <span className="text-[var(--muted-text)]">Connected</span>
                <button type="button" className="btn-inline" onClick={() => openAyrshareManage(p)}>
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <BrandedButton type="button" variant="outline" onClick={onClose}>Cancel</BrandedButton>
          <BrandedButton type="submit" disabled={isSubmitting}>Save</BrandedButton>
        </div>
      </form>
    </Modal>
  )
}

export default SettingsModal


