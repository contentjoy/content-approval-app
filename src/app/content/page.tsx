import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ContentPage() {
  const mockContent = [
    {
      id: '1',
      title: 'Getting Started with Next.js 14',
      description: 'A comprehensive guide to building modern web applications with Next.js 14',
      status: 'pending' as const,
      author: 'John Doe',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      title: 'Advanced TypeScript Patterns',
      description: 'Learn advanced TypeScript patterns for better code organization',
      status: 'approved' as const,
      author: 'Jane Smith',
      updatedAt: '2024-01-14T15:45:00Z'
    },
    {
      id: '3',
      title: 'Building Scalable APIs',
      description: 'Best practices for designing and implementing scalable APIs',
      status: 'draft' as const,
      author: 'Mike Johnson',
      updatedAt: '2024-01-13T09:15:00Z'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content</h1>
          <p className="text-gray-600">Manage and review your content</p>
        </div>
        <Link href="/content/new">
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Content
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search content..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {mockContent.map((content) => (
            <div key={content.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {content.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(content.status)}`}>
                      {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{content.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>By {content.author}</span>
                    <span>•</span>
                    <span>{new Date(content.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Link href={`/content/${content.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                  <Link href={`/content/${content.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
