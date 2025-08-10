import { create } from 'zustand'
import type { SocialMediaPost } from '@/types'

export type ModalType = 'approve' | 'disapprove' | 'edit-caption' | 'schedule' | 'comments' | 'regenerate' | 'feedback' | null

interface ModalState {
  isOpen: boolean
  modalType: ModalType
  post: SocialMediaPost | null
  carouselPosts: SocialMediaPost[]
  approvedPosts: SocialMediaPost[]
  openModal: (type: ModalType, post?: SocialMediaPost | null, carouselPosts?: SocialMediaPost[], approvedPosts?: SocialMediaPost[]) => void
  setApprovedPosts: (posts: SocialMediaPost[]) => void
  closeModal: () => void
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  modalType: null,
  post: null,
  carouselPosts: [],
  approvedPosts: [],
  openModal: (type, post = null, carouselPosts = [], approvedPosts = []) => {
    set({
      isOpen: true,
      modalType: type,
      post,
      carouselPosts,
      approvedPosts
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
      // Keep approvedPosts so Schedule can be reopened without resyncing
      // approvedPosts preserved
    })
  }
}))
