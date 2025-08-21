'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, Globe, ChevronDown, Image as ImageIcon, Video as VideoIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth-context'

const schema = z.object({
  caption: z.string().min(1, 'Caption is required'),
  title: z.string().min(1, 'Title is required'),
  timezone: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  platforms: z.array(z.string()).min(1, 'Select at least one platform')
})
type FormData = z.infer<typeof schema>

function parseTime12h(t: string) {
  const m = String(t||'').trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return { H: 9, M: 0 }
  const h = parseInt(m[1],10); const min = parseInt(m[2],10)
  return { H: h, M: min }
}

function zonedWallTimeToUTC(y: number, m: number, d: number, H: number, M: number, tz: string) {
  const asUTC = new Date(Date.UTC(y, m-1, d, H, M, 0, 0))
  const inTZ  = new Date(asUTC.toLocaleString('en-US', { timeZone: tz }))
  const diff  = asUTC.getTime() - inTZ.getTime()
  return new Date(asUTC.getTime() + diff)
}

export function CreatePostModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) {
  const { showToast } = useToast()
  const { user } = useAuth()
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      caption: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return '' } })(),
      platforms: []
    }
  })

  const [platformOptions, setPlatformOptions] = useState<{ id: string; label: string }[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        // Get profile platforms from gym via API (needs gymId)
        const qs = user?.gymId
          ? `?gymId=${encodeURIComponent(user.gymId)}`
          : (typeof window !== 'undefined' ? `?gymSlug=${encodeURIComponent(window.location.pathname.split('/')[1] || '')}` : '')
        const res = await fetch(`/api/gym-profile${qs}`)
        if (res.ok) {
          const data = await res.json()
          const profiles = data.ayrshare_profiles || {}
          const opts = Object.keys(profiles).map(k => ({ id: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))
          setPlatformOptions(opts)
        } else {
          setPlatformOptions([])
        }
      } catch {
        setPlatformOptions([])
      }
    })()
  }, [isOpen, user?.gymId])

  // Ensure timezone has a valid default from options
  useEffect(() => {
    if (!isOpen) return
    try {
      const tzCandidate = Intl.DateTimeFormat().resolvedOptions().timeZone
      const exists = TIMEZONE_OPTIONS.some(o => o.value === tzCandidate)
      setValue('timezone', exists ? tzCandidate : TIMEZONE_OPTIONS[0].value)
    } catch {
      setValue('timezone', TIMEZONE_OPTIONS[0].value)
    }
  }, [isOpen, setValue])

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || [])
    if (chosen.length) setFiles(chosen)
  }

  // Build object URLs for previews and clean up
  useEffect(() => {
    const urls = files.map(f => URL.createObjectURL(f))
    setPreviewUrls(urls)
    return () => {
      urls.forEach(u => URL.revokeObjectURL(u))
    }
  }, [files])

  const onSubmit = async (data: FormData) => {
    try {
      // Convert date/time/timezone -> Ayrshare scheduleDate (ISO Z) and DB format
      const [Y, Mo, D] = data.date.split('-').map(n => parseInt(n,10))
      const { H, M } = parseTime12h(data.time)
      const utcDate = zonedWallTimeToUTC(Y, Mo, D, H, M, data.timezone)
      const scheduleDateISO = utcDate.toISOString().replace('.000Z','Z')
      const scheduleDB = `${data.date} ${data.time}:00`

      // Upload selected files to Supabase Storage bucket 'post-media' and get public URLs
      const mediaUrls: string[] = []
      if (files.length > 0) {
        const bucket = 'post-media'
        for (const f of files) {
          const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          const folder = user?.gymId || (typeof window !== 'undefined' ? (window.location.pathname.split('/')[1] || 'unknown') : 'unknown')
          const path = `${folder}/${Date.now()}_${safeName}`
          const { error: upErr } = await supabase.storage.from(bucket).upload(path, f, { contentType: f.type })
          if (upErr) throw new Error(`Upload failed: ${upErr.message}`)
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
          if (pub?.publicUrl) mediaUrls.push(pub.publicUrl)
        }
      }
      // TODO: Integrate Drive upload flow; for now skip upload and rely on links when available

      // Call backend to create Ayrshare post (new endpoint could be added later). For now, perform direct call here.
      const r = await fetch('/api/ayrshare/create-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.gymId ? { 'x-gym-id': user.gymId } : {}),
          ...(typeof window !== 'undefined' ? { 'x-gym-slug': (window.location.pathname.split('/')[1] || '') } : {})
        },
        body: JSON.stringify({
          post: data.caption,
          title: data.title,
          platforms: data.platforms,
          mediaUrls,
          scheduleDate: scheduleDateISO,
          timezone: data.timezone
        })
      })
      if (!r.ok) {
        const t = await r.text()
        console.error('❌ create-post failed:', t)
        throw new Error(t || 'Create failed')
      }
      const result = await r.json()
      // Broadcast for calendar refresh
      try { window.dispatchEvent(new CustomEvent('post-updated', { detail: { type: 'scheduled', id: result?.id } })) } catch {}

      showToast({ type: 'success', title: 'Success', message: 'Post scheduled successfully' })
      onSuccess?.()
      onClose()
    } catch (e) {
      showToast({ type: 'error', title: 'Failed', message: 'Could not create post' })
    }
  }

  const tz = watch('timezone')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Media + Caption (responsive) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Media (1/3 on desktop) */}
          <div className="bg-[var(--modal-surface)] rounded-[16px] p-4 border border-[var(--modal-border)] md:col-span-1 md:min-h-[460px] flex flex-col">
            <label className="block text-sm font-medium text-foreground mb-2">Media</label>
            <div className="w-full aspect-[4/5] md:h-full rounded-[16px] border border-[var(--modal-border)] bg-[var(--bg)] flex items-center justify-center overflow-hidden">
              {files.length === 0 ? (
                <label className="w-full h-full flex items-center justify-center cursor-pointer">
                  <input type="file" multiple accept="image/*,video/*" onChange={onSelectFiles} className="hidden" />
                  <div className="text-center text-[var(--muted-text)]">
                    <div className="text-sm mb-1">Tap to upload photo or video</div>
                    <div className="text-xs">Recommended 4:5 or 9:16</div>
                  </div>
                </label>
              ) : (
                <button type="button" className="w-full h-full" onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = 'image/*,video/*'
                  input.onchange = (ev: any) => onSelectFiles(ev as any)
                  input.click()
                }}>
                  {(() => {
                    const first = files[0]
                    const url = previewUrls[0]
                    if (!first || !url) return null
                    if (first.type.startsWith('image/')) {
                      return <img src={url} alt="preview" className="w-full h-full object-cover" />
                    }
                    return <video src={url} className="w-full h-full object-cover" controls muted playsInline />
                  })()}
                </button>
              )}
            </div>
          </div>
          {/* Caption (2/3 on desktop) */}
          <div className="md:col-span-2 md:min-h-[460px] flex flex-col gap-3">
            <input
              type="text"
              placeholder="Title"
              {...register('title')}
              className="w-full px-3 py-3 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200"
            />
            <textarea
              rows={10}
              placeholder="Write your caption here..."
              {...register('caption')}
              className="w-full px-3 py-3 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200 resize-none md:flex-1"
            />
          </div>
        </div>

        {/* Platforms */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Platforms</label>
          {platformOptions.length === 0 ? (
            <p className="text-sm text-[var(--muted-text)]">No connected platforms found. Connect via Settings.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {platformOptions.map(opt => (
                <label key={opt.id} className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--modal-border)] rounded-[999px] cursor-pointer text-sm">
                  <input type="checkbox" value={opt.id} {...register('platforms')} className="accent-current" />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}
          {errors.platforms && <p className="mt-1 text-sm text-destructive">{errors.platforms.message as any}</p>}
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Timezone <span className="text-destructive">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-[var(--muted-text)]" />
              </div>
              <select {...register('timezone')} className="w-full pl-10 pr-3 py-2 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer">
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-[var(--muted-text)]" />
              </div>
            </div>
            {errors.timezone && <p className="mt-1 text-sm text-destructive">{errors.timezone.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-full">
            <div className="min-w-0">
              <label className="block text-sm font-medium text-foreground mb-2">Date <span className="text-destructive">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-[var(--muted-text)]" />
                </div>
                <input type="date" {...register('date')} className="w-full pl-10 pr-3 py-4 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200 font-normal box-border" />
              </div>
              {errors.date && <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="min-w-0">
              <label className="block text-sm font-medium text-foreground mb-2">Time <span className="text-destructive">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-4 w-4 text-[var(--muted-text)]" />
                </div>
                <input type="time" {...register('time')} className="w-full pl-10 pr-3 py-4 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200 font-normal box-border" />
              </div>
              {errors.time && <p className="mt-1 text-sm text-destructive">{errors.time.message}</p>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--modal-border)] pb-4">
          <button type="button" onClick={onClose} className="h-12 px-6 py-3 rounded-[999px] border border-[var(--border)] text-[var(--text)] bg-transparent transition-all duration-200 hover:bg-[var(--modal-surface)]">Cancel</button>
          <button type="submit" className="h-12 px-6 py-3 rounded-[999px] bg-[#111113] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#111113] border border-[var(--modal-border)] transition-all duration-200 hover:opacity-90">Schedule Post</button>
        </div>
      </form>
    </Modal>
  )
}

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]


