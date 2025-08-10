'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}){1,2}$/i, 'Use a HEX color (e.g., #20B8CD)')
})

export type SettingsModalData = z.infer<typeof schema>

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  gymId: string
  initial: Partial<SettingsModalData>
  onSaved?: (data: SettingsModalData) => void
}

export function SettingsModal({ isOpen, onClose, gymId, initial, onSaved }: SettingsModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SettingsModalData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: initial.email || '',
      primaryColor: initial.primaryColor || '#20B8CD'
    }
  })

  const onSubmit = async (values: SettingsModalData) => {
    const { error } = await supabase
      .from('gyms')
      .update({
        'Email': values.email,
        'Primary color': values.primaryColor
      })
      .eq('id', gymId)

    if (error) {
      alert(`Failed to update settings: ${error.message}`)
      return
    }
    onSaved?.(values)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-bg text-text"
            placeholder="owner@example.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">Primary Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              {...register('primaryColor')}
              className="w-14 h-10 border border-border rounded-md"
            />
            <input
              type="text"
              {...register('primaryColor')}
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-bg text-text"
              placeholder="#D1D5DB"
            />
          </div>
          {errors.primaryColor && (
            <p className="text-sm text-destructive mt-1">{errors.primaryColor.message}</p>
          )}
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


