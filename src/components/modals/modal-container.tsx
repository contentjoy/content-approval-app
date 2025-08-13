'use client'

import { useModalStore } from '@/hooks/use-modal-store'
import { ApprovalModal } from './approval-modal'
import { DisapprovalModal } from './disapproval-modal'
import { EditCaptionModal } from './edit-caption-modal'
import { SchedulingModal } from './scheduling-modal'
import { CommentsModal } from './comments-modal'
import { RegenerateModal } from './regenerate-modal'
import { FeedbackModal } from './feedback-modal'
import { UploadModal } from './upload-modal'

export function ModalContainer() {
  const { isOpen, modalType, post, carouselPosts, approvedPosts, bulkPosts, closeModal } = useModalStore() as any

  if (!isOpen) {
    return null
  }

  const handleSuccess = (detail?: any) => {
    // Broadcast an app-wide update so views can optimistically update
    try {
      window.dispatchEvent(new CustomEvent('post-updated', { detail }))
    } catch (_) {}
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
          bulkPosts={bulkPosts}
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
          bulkPosts={bulkPosts}
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
    case 'comments':
      if (!post) return null
      return (
        <CommentsModal isOpen={isOpen} onClose={closeModal} post={post} onSuccess={handleSuccess} />
      )
    case 'regenerate':
      if (!post) return null
      return (
        <RegenerateModal isOpen={isOpen} onClose={closeModal} post={post} onSuccess={handleSuccess} />
      )
    case 'feedback':
      if (!post) return null
      return (
        <FeedbackModal isOpen={isOpen} onClose={closeModal} post={post} carouselPosts={carouselPosts} onSuccess={handleSuccess} />
      )
    case 'upload':
      return (
        <UploadModal isOpen={isOpen} onClose={closeModal} onSuccess={handleSuccess} />
      )
    // case 'comments':
    //   if (!post) return null
    //   return (
    //     <CommentsModal isOpen={isOpen} onClose={closeModal} post={post} onSuccess={handleSuccess} />
    //   )
    // case 'regenerate':
    //   if (!post) return null
    //   return (
    //     <RegenerateModal isOpen={isOpen} onClose={closeModal} post={post} onSuccess={handleSuccess} />
    //   )
    // case 'feedback':
    //   if (!post) return null
    //   return (
    //     <FeedbackModal isOpen={isOpen} onClose={closeModal} post={post} onSuccess={handleSuccess} />
    //   )
    default:
      return null
  }
}
