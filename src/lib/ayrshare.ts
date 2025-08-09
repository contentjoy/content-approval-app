import type { AyrshareProfile, AyrsharePostData } from '@/types'

const AYRSHARE_API_URL = 'https://app.ayrshare.com/api'

class AyrshareService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.AYRSHARE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('AYRSHARE_API_KEY not found in environment variables')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${AYRSHARE_API_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ayrshare API error: ${response.status} - ${error}`)
    }

    return response.json()
  }

  // Get connected social media profiles
  async getProfiles(): Promise<AyrshareProfile[]> {
    try {
      const data = await this.makeRequest('/profiles')
      return data.profiles || []
    } catch (error) {
      console.error('Failed to fetch Ayrshare profiles:', error)
      throw error
    }
  }

  // Post content to social media platforms
  async createPost(postData: AyrsharePostData): Promise<{ success: boolean; id?: string; errors?: any }> {
    try {
      const payload = {
        post: postData.post,
        platforms: postData.platforms,
        mediaUrls: postData.mediaUrls || [],
        scheduleDate: postData.scheduleDate,
        profiles: postData.profiles || [],
      }

      // Remove undefined values
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof typeof payload] === undefined) {
          delete payload[key as keyof typeof payload]
        }
      })

      const data = await this.makeRequest('/post', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      return {
        success: true,
        id: data.id,
      }
    } catch (error) {
      console.error('Failed to create Ayrshare post:', error)
      return {
        success: false,
        errors: error,
      }
    }
  }

  // Get post analytics
  async getPostAnalytics(postId: string) {
    try {
      return await this.makeRequest(`/analytics/post/${postId}`)
    } catch (error) {
      console.error('Failed to fetch post analytics:', error)
      throw error
    }
  }

  // Get account analytics
  async getAccountAnalytics(platforms: string[] = []) {
    try {
      const query = platforms.length > 0 ? `?platforms=${platforms.join(',')}` : ''
      return await this.makeRequest(`/analytics/social${query}`)
    } catch (error) {
      console.error('Failed to fetch account analytics:', error)
      throw error
    }
  }

  // Validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      await this.makeRequest('/user')
      return true
    } catch (error) {
      console.error('Ayrshare API key validation failed:', error)
      return false
    }
  }

  // Generate authentication URL for connecting social accounts
  generateAuthUrl(platform: string, redirectUrl: string): string {
    const params = new URLSearchParams({
      platform,
      redirect: redirectUrl,
    })
    
    return `${AYRSHARE_API_URL}/auth/url?${params.toString()}`
  }

  // Delete a scheduled post
  async deletePost(postId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/delete/${postId}`, {
        method: 'DELETE',
      })
      return true
    } catch (error) {
      console.error('Failed to delete post:', error)
      return false
    }
  }

  // Update a scheduled post
  async updatePost(postId: string, updates: Partial<AyrsharePostData>): Promise<boolean> {
    try {
      await this.makeRequest(`/update/${postId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      return true
    } catch (error) {
      console.error('Failed to update post:', error)
      return false
    }
  }
}

export const ayrshareService = new AyrshareService()
export default ayrshareService
