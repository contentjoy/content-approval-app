import { create } from 'zustand'
import type { SocialMediaPost } from '@/types'

export type ModalType = 'approve' | 'disapprove' | 'edit-caption' | 'edit-schedule' | 'schedule' | 'comments' | 'regenerate' | 'feedback' | 'upload' | 'create-post' | null

interface ModalState {
  isOpen: boolean
  modalType: ModalType
  post: SocialMediaPost | null
  carouselPosts: SocialMediaPost[]
  approvedPosts: SocialMediaPost[]
  bulkPosts: SocialMediaPost[]
  openModal: (type: ModalType, post?: SocialMediaPost | null, carouselPosts?: SocialMediaPost[], approvedPosts?: SocialMediaPost[], bulkPosts?: SocialMediaPost[]) => void
  setApprovedPosts: (posts: SocialMediaPost[]) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  modalType: null,
  post: null,
  carouselPosts: [],
  approvedPosts: [],
  bulkPosts: [],
  openModal: (type, post = null, carouselPosts = [], approvedPosts = [], bulkPosts = []) => {
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
  }
}))
