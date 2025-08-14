import { create } from 'zustand'
import type { SocialMediaPost } from '@/types'

export type ModalType = 'approve' | 'disapprove' | 'edit-caption' | 'schedule' | 'comments' | 'regenerate' | 'feedback' | 'upload' | null

interface ModalState {
  isOpen: boolean
  modalType: ModalType
  post: SocialMediaPost | null
  carouselPosts: SocialMediaPost[]
  approvedPosts: SocialMediaPost[]
  bulkPosts: SocialMediaPost[]
  isUploading: boolean
  openModal: (type: ModalType, post?: SocialMediaPost | null, carouselPosts?: SocialMediaPost[], approvedPosts?: SocialMediaPost[], bulkPosts?: SocialMediaPost[]) => void
  setApprovedPosts: (posts: SocialMediaPost[]) => void
  closeModal: () => void
  setUploading: (isUploading: boolean) => void
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  modalType: null,
  post: null,
  carouselPosts: [],
  approvedPosts: [],
  bulkPosts: [],
  isUploading: false,
  openModal: (type, post = null, carouselPosts = [], approvedPosts = [], bulkPosts = []) => {
    // Don't open upload modal if upload is in progress
    if (type === 'upload' && useModalStore.getState().isUploading) {
      return
    }
    
    set({
      isOpen: true,
      modalType: type,
      post,
      carouselPosts,
      approvedPosts,
      bulkPosts
    })
  },
  setApprovedPosts: (posts) => {
    set({ approvedPosts: posts })
  },
  closeModal: () => {
    set({
      isOpen: false,
      modalType: null,
      post: null,
      carouselPosts: [],
      approvedPosts: [],
      bulkPosts: []
    })
  },
  setUploading: (isUploading) => {
    set({ isUploading })
  }
}))
