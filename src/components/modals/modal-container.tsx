'use client'

import React from 'react'
import { useModalStore } from '@/hooks/use-modal-store'
import { ApprovalModal } from './approval-modal'
import { DisapprovalModal } from './disapproval-modal'
import { CommentsModal } from './comments-modal'
import { EditCaptionModal } from './edit-caption-modal'
import { EditScheduleModal } from './edit-schedule-modal'
import { RegenerateModal } from './regenerate-modal'
import { SchedulingModal } from './scheduling-modal'
import { FeedbackModal } from './feedback-modal'
import { UploadModal } from './upload-modal'
import { CreatePostModal } from './create-post-modal'

export function ModalContainer() {
  const { isOpen, modalType, post, carouselPosts, approvedPosts, closeModal } = useModalStore()

  return (
    <>
      <UploadModal
        isOpen={modalType === 'upload'}
        onClose={closeModal}
      />
      <SchedulingModal
        isOpen={modalType === 'schedule'}
        onClose={closeModal}
        approvedPosts={approvedPosts}
      />
      <DisapprovalModal
        isOpen={modalType === 'disapprove'}
        onClose={closeModal}
        post={post!}
        carouselPosts={carouselPosts}
      />
      <CommentsModal
        isOpen={modalType === 'comments'}
        onClose={closeModal}
        post={post!}
      />
      <EditCaptionModal
        isOpen={modalType === 'edit-caption'}
        onClose={closeModal}
        post={post!}
      />
      <EditScheduleModal
        isOpen={modalType === 'edit-schedule'}
        onClose={closeModal}
        post={post!}
      />
      <RegenerateModal
        isOpen={modalType === 'regenerate'}
        onClose={closeModal}
        post={post!}
      />
      <FeedbackModal
        isOpen={modalType === 'feedback'}
        onClose={closeModal}
        post={post!}
      />
      <ApprovalModal
        isOpen={modalType === 'approve'}
        onClose={closeModal}
        post={post!}
        carouselPosts={carouselPosts}
      />
      <CreatePostModal
        isOpen={modalType === 'create-post'}
        onClose={closeModal}
      />
    </>
  )
}