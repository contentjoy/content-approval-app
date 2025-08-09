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
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✓',
          animation: 'approved'
        }
      case 'rejected':
      case 'disapproved':
        return {
          label: 'Rejected',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '✗',
          animation: 'rejected'
        }
      case 'draft':
        return {
          label: 'Draft',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '📝',
          animation: 'draft'
        }
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
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
      className={`inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold border shadow-sm ${config.color} ${className}`}
    >
      <span className="mr-1.5">{config.icon}</span>
      {config.label}
    </motion.span>
  )
}
