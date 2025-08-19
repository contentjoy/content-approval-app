'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { useToast } from '@/components/ui/toast'
import type { SocialMediaPost } from '@/types'

const schema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  caption: z.string().optional(),
  timezone: z.string().min(1)
})
type FormData = z.infer<typeof schema>

export function EditScheduleModal({ isOpen, onClose, post, onSuccess }: { isOpen: boolean; onClose: () => void; post: SocialMediaPost; onSuccess?: () => void }) {
  const { showToast } = useToast()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!post) return
    const ts = post['Scheduled'] ? new Date(post['Scheduled']) : new Date()
    setValue('date', ts.toISOString().split('T')[0])
    const hh = String(ts.getHours()).padStart(2, '0')
    const mm = String(ts.getMinutes()).padStart(2, '0')
    setValue('time', `${hh}:${mm}`)
    setValue('caption', post['Post Caption'] || '')
    try { setValue('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone) } catch { setValue('timezone', 'UTC') }
  }, [post, setValue])

  const onSubmit = async (data: FormData) => {
    const scheduledDate = `${data.date} ${data.time}:00`
    try {
      const res = await fetch('/api/posts/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, caption: data.caption, scheduledDate, timezone: data.timezone })
      })
      if (!res.ok) throw new Error(await res.text())
      showToast({ type: 'success', title: 'Post updated', message: 'Post has been updated' })
      onSuccess?.()
      onClose()
    } catch (e) {
      showToast({ type: 'error', title: 'Update failed', message: 'Unable to update post' })
    }
  }

  const onDelete = async () => {
    try {
      const res = await fetch('/api/posts/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, action: 'delete' })
      })
      if (!res.ok) throw new Error(await res.text())
      showToast({ type: 'success', title: 'Post deleted', message: 'Post removed from Ayrshare' })
      onSuccess?.()
      onClose()
    } catch {
      showToast({ type: 'error', title: 'Delete failed', message: 'Unable to delete post' })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Schedule" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Scheduled Date</label>
          <input type="date" {...register('date')} className="w-full border rounded px-3 py-2" />
          {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Scheduled Time</label>
          <input type="time" {...register('time')} className="w-full border rounded px-3 py-2" />
          {errors.time && <p className="text-sm text-red-500">{errors.time.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Caption</label>
          <textarea rows={8} {...register('caption')} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Timezone</label>
          <input type="text" {...register('timezone')} className="w-full border rounded px-3 py-2" />
          {errors.timezone && <p className="text-sm text-red-500">{errors.timezone.message}</p>}
        </div>
        <div className="flex justify-between pt-3 border-t">
          <BrandedButton type="button" variant="outline" onClick={onDelete}>Delete</BrandedButton>
          <div className="flex gap-2">
            <BrandedButton type="button" variant="outline" onClick={onClose}>Cancel</BrandedButton>
            <BrandedButton type="submit">Confirm</BrandedButton>
          </div>
        </div>
      </form>
    </Modal>
  )
}


