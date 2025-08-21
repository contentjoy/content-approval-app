'use client'

import { useEffect, useState } from 'react'
import { useModalStore } from '@/hooks/use-modal-store'
import { UploadModal } from './upload-modal'
import { SchedulingModal } from './scheduling-modal'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false)
  const { gymSlug } = useParams()
  const { showToast } = useToast()
  const { 
    isOpen, 
    modalType, 
    approvedPosts, 
    closeModal 
  } = useModalStore()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (modalType === 'schedule') {
      const checkSocialProfiles = async () => {
        const { data: gym } = await supabase
          .from('gyms')
          .select('ayrshare_profiles')
          .eq('slug', gymSlug)
          .single()

        if (!gym?.ayrshare_profiles) {
          showToast({
            type: 'warning',
            title: 'Social Accounts Required',
            message: 'Please connect your social accounts in account settings'
          })
          closeModal()
        }
      }

      checkSocialProfiles()
    }
  }, [modalType, gymSlug, showToast, closeModal])

  if (!isMounted) {
    return null
  }

  return (
    <>
      <UploadModal 
        isOpen={isOpen && modalType === 'upload'} 
        onClose={closeModal} 
      />
      <SchedulingModal 
        isOpen={isOpen && modalType === 'schedule'} 
        onClose={closeModal}
        approvedPosts={approvedPosts}
      />
    </>
  )
}