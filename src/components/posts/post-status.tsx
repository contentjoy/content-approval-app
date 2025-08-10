'use client'

import { motion } from 'framer-motion'

interface PostStatusProps {
  status: string
  className?: string
}

export function PostStatus({ status, className = '' }: PostStatusProps) {
  const lowerStatus = status.toLowerCase()
  
  // Don't show anything for pending status
  if (lowerStatus === 'pending') {
    return null
  }
  
  const getStatusConfig = (status: string) => {
    switch (lowerStatus) {
      case 'approved':
        return {
          label: 'Approved',
          color: 'bg-accent-soft text-accent border-accent',
          icon: '✓',
          animation: 'approved'
        }
      case 'rejected':
      case 'disapproved':
        return {
          label: 'Rejected',
          color: 'bg-destructive/10 text-destructive border-destructive/20',
          icon: '✗',
          animation: 'rejected'
        }
      case 'draft':
        return {
          label: 'Draft',
          color: 'bg-bg-elev-1 text-muted-text border-border',
          icon: '📝',
          animation: 'draft'
        }
      default:
        return {
          label: status,
          color: 'bg-bg-elev-1 text-muted-text border-border',
          icon: '❓',
          animation: 'default'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold border shadow-soft ${config.color} ${className}`}
    >
      <span className="mr-1.5">{config.icon}</span>
      {config.label}
    </motion.span>
  )
}
