'use client'

import { useModalStore } from '@/hooks/use-modal-store'
import { useUpload } from '@/contexts/upload-context'
import { ApprovalModal } from './approval-modal'
import { DisapprovalModal } from './disapproval-modal'
import { EditCaptionModal } from './edit-caption-modal'
import { SchedulingModal } from './scheduling-modal'
import { CommentsModal } from './comments-modal'
import { RegenerateModal } from './regenerate-modal'
import { FeedbackModal } from './feedback-modal'
import { UploadModal } from './upload-modal'
import { FloatingUploadProgress } from './upload-modal'
import { CreatePostModal } from './create-post-modal'

export function ModalContainer() {
  const { isOpen, modalType, post, carouselPosts, approvedPosts, bulkPosts, closeModal } = useModalStore() as any
  const { uploadState, closeProgress, minimizeProgress } = useUpload()

  const handleSuccess = (detail?: any) => {
    // Broadcast an app-wide update so views can optimistically update
    try {
      window.dispatchEvent(new CustomEvent('post-updated', { detail }))
    } catch (_) {}
  }

  return (
    <>
      {/* Render modals when open */}
      {isOpen && (
        (() => {
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
                <UploadModal 
                  isOpen={isOpen} 
                  onClose={closeModal} 
                  onSuccess={handleSuccess}
                />
              )
            case 'create-post':
              return (
                <CreatePostModal
                  isOpen={isOpen}
                  onClose={closeModal}
                  onSuccess={handleSuccess}
                />
              )
            default:
              return null
          }
        })()
      )}

      {/* Floating Upload Progress Component - Always rendered when needed */}
      {uploadState.showProgress && (
        <FloatingUploadProgress
          isVisible={uploadState.showProgress}
          progress={uploadState.progress}
          currentFile={uploadState.currentFile}
          totalFiles={uploadState.totalFiles}
          onClose={closeProgress}
          onMinimize={minimizeProgress}
          isMinimized={uploadState.isMinimized}
        />
      )}
    </>
  )
}
