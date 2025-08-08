'use client'

import { useModalStore } from '@/hooks/use-modal-store'
import { ApprovalModal } from './approval-modal'
import { DisapprovalModal } from './disapproval-modal'
import { EditCaptionModal } from './edit-caption-modal'
import { SchedulingModal } from './scheduling-modal'

export function ModalContainer() {
  const { isOpen, modalType, post, carouselPosts, approvedPosts, closeModal } = useModalStore()

  if (!isOpen) {
    return null
  }

  const handleSuccess = () => {
    // Refresh the page or update the posts list
    window.location.reload()
  }

  switch (modalType) {
    case 'approve':
      if (!post) return null
      return (
        <ApprovalModal
          isOpen={isOpen}
          onClose={closeModal}
          post={post}
          carouselPosts={carouselPosts}
          onSuccess={handleSuccess}
        />
      )
    case 'disapprove':
      if (!post) return null
      return (
        <DisapprovalModal
          isOpen={isOpen}
          onClose={closeModal}
          post={post}
          carouselPosts={carouselPosts}
          onSuccess={handleSuccess}
        />
      )
    case 'edit-caption':
      if (!post) return null
      return (
        <EditCaptionModal
          isOpen={isOpen}
          onClose={closeModal}
          post={post}
          onSuccess={handleSuccess}
        />
      )
    case 'schedule':
      return (
        <SchedulingModal
          isOpen={isOpen}
          onClose={closeModal}
          approvedPosts={approvedPosts}
          onSuccess={handleSuccess}
        />
      )
    default:
      return null
  }
}
