'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message: string
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(({ type, title, message }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg ${
              toast.type === 'error' ? 'bg-destructive text-destructive-foreground' :
              toast.type === 'success' ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' :
              'bg-[var(--surface)] text-[var(--text)]'
            }`}
          >
            <div className="font-semibold">{toast.title}</div>
            <div className="text-sm">{toast.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
