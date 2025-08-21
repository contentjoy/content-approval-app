'use client'

import { useEffect, useState } from 'react'
import { useModalStore } from '@/hooks/use-modal-store'
import { UploadModal } from './upload-modal'
import { SchedulingModal } from './scheduling-modal'
import { CreatePostModal } from './create-post-modal'
import { ApprovalModal } from './approval-modal'
import { DisapprovalModal } from './disapproval-modal'
import { EditCaptionModal } from './edit-caption-modal'
import { EditScheduleModal } from './edit-schedule-modal'
import { CommentsModal } from './comments-modal'
import { RegenerateModal } from './regenerate-modal'
import { FeedbackModal } from './feedback-modal'
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
    post, 
    carouselPosts, 
    approvedPosts, 
    bulkPosts, 
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
      <CreatePostModal 
        isOpen={isOpen && modalType === 'create-post'} 
        onClose={closeModal} 
      />
      <ApprovalModal 
        isOpen={isOpen && modalType === 'approve'} 
        onClose={closeModal}
        post={post}
        carouselPosts={carouselPosts}
      />
      <DisapprovalModal 
        isOpen={isOpen && modalType === 'disapprove'} 
        onClose={closeModal}
        post={post}
        carouselPosts={carouselPosts}
      />
      <EditCaptionModal 
        isOpen={isOpen && modalType === 'edit-caption'} 
        onClose={closeModal}
        post={post}
      />
      <EditScheduleModal 
        isOpen={isOpen && modalType === 'edit-schedule'} 
        onClose={closeModal}
        post={post}
      />
      <CommentsModal 
        isOpen={isOpen && modalType === 'comments'} 
        onClose={closeModal}
        post={post}
      />
      <RegenerateModal 
        isOpen={isOpen && modalType === 'regenerate'} 
        onClose={closeModal}
        post={post}
      />
      <FeedbackModal 
        isOpen={isOpen && modalType === 'feedback'} 
        onClose={closeModal}
        post={post}
      />
    </>
  )
}