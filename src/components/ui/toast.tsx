'use client'

import React, { useState, createContext, useContext, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])

    // Auto-hide after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        hideToast(id)
      }, toast.duration || 5000)
    }
  }

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastContainerProps {
  toasts: Toast[]
  hideToast: (id: string) => void
}

function ToastContainer({ toasts, hideToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden`}
          >
            <div className="flex items-start p-4">
              <div className="flex-shrink-0">
                <ToastIcon type={toast.type} />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                {toast.message && (
                  <p className="text-sm text-gray-500 mt-1">{toast.message}</p>
                )}
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => hideToast(toast.id)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-gray-200">
              <motion.div
                className={`h-full ${
                  toast.type === 'success' ? 'bg-green-500' :
                  toast.type === 'error' ? 'bg-red-500' :
                  toast.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: toast.duration ? toast.duration / 1000 : 5, ease: 'linear' }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastIcon({ type }: { type: Toast['type'] }) {
  switch (type) {
    case 'success':
      return (
        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    case 'error':
      return (
        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )
    case 'warning':
      return (
        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
  }
}
