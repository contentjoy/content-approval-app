'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { Calendar, Clock, Globe, ChevronDown, Image as ImageIcon, Video as VideoIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  caption: z.string().optional(),
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
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      caption: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'UTC' } })(),
      platforms: []
    }
  })

  const [platformOptions, setPlatformOptions] = useState<{ id: string; label: string }[]>([])
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        // Get profile platforms from gym via API
        const res = await fetch('/api/gym-profile')
        if (res.ok) {
          const data = await res.json()
          const profiles = data.ayrshare_profiles || {}
          const opts = Object.keys(profiles).map(k => ({ id: k, label: k.charAt(0).toUpperCase() + k.slice(1) }))
          setPlatformOptions(opts)
        }
      } catch {}
    })()
  }, [isOpen])

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || [])
    if (chosen.length) setFiles(chosen)
  }

  const onSubmit = async (data: FormData) => {
    try {
      // Convert date/time/timezone -> Ayrshare scheduleDate (ISO Z) and DB format
      const [Y, Mo, D] = data.date.split('-').map(n => parseInt(n,10))
      const { H, M } = parseTime12h(data.time)
      const utcDate = zonedWallTimeToUTC(Y, Mo, D, H, M, data.timezone)
      const scheduleDateISO = utcDate.toISOString().replace('.000Z','Z')
      const scheduleDB = `${data.date} ${data.time}:00`

      // TODO: upload files first via existing upload flow; for now assume mediaUrls empty or provided
      const mediaUrls: string[] = []

      // Call backend to create Ayrshare post (new endpoint could be added later). For now, perform direct call here.
      const r = await fetch('/api/ayrshare/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post: data.caption,
          platforms: data.platforms,
          mediaUrls,
          scheduleDate: scheduleDateISO,
          timezone: data.timezone
        })
      })
      if (!r.ok) throw new Error(await r.text())

      showToast({ type: 'success', title: 'Scheduled', message: 'Post scheduled successfully' })
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
        {/* Media */}
        <div className="bg-[var(--modal-surface)] rounded-[12px] p-4 border border-[var(--modal-border)]">
          <label className="block text-sm font-medium text-foreground mb-2">Media (Photo / Video / Carousel)</label>
          <input type="file" multiple accept="image/*,video/*" onChange={onSelectFiles} className="w-full px-3 py-2 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px]" />
          {files.length > 0 && (
            <div className="text-xs text-[var(--muted-text)] mt-2">{files.length} file(s) selected</div>
          )}
        </div>

        {/* Caption */}
        <div className="grid grid-cols-1 gap-2">
          <label className="block text-sm font-medium text-foreground">Caption</label>
          <textarea rows={6} {...register('caption')} className="w-full px-3 py-2 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200" />
        </div>

        {/* Platforms */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map(opt => (
              <label key={opt.id} className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--modal-border)] rounded-[999px] cursor-pointer text-sm">
                <input type="checkbox" value={opt.id} {...register('platforms')} className="accent-current" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
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
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date <span className="text-destructive">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-[var(--muted-text)]" />
              </div>
              <input type="date" {...register('date')} className="w-full pl-10 pr-3 py-2 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200" />
            </div>
            {errors.date && <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Time <span className="text-destructive">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-4 w-4 text-[var(--muted-text)]" />
              </div>
              <input type="time" {...register('time')} className="w-full pl-10 pr-3 py-2 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200" />
            </div>
            {errors.time && <p className="mt-1 text-sm text-destructive">{errors.time.message}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--modal-border)]">
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


