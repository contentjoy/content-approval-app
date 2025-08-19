import type { AyrshareProfile, AyrsharePostData } from '@/types'

// Use public API hostname per docs
const AYRSHARE_API_URL = 'https://api.ayrshare.com/api'

class AyrshareService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.AYRSHARE_API_KEY || ''
    if (!this.apiKey) {
      console.warn('AYRSHARE_API_KEY not found in environment variables')
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}, profileKey?: string, idempotencyKey?: string) {
    const url = `${AYRSHARE_API_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...(profileKey ? { 'Profile-Key': profileKey } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ Ayrshare request failed', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        body: (() => { try { return JSON.parse((options as any)?.body || '{}') } catch { return String((options as any)?.body || '').slice(0,200) } })()
      })
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
  async createPost(postData: AyrsharePostData, profileKey?: string): Promise<{ success: boolean; id?: string; refId?: string; errors?: unknown }> {
    try {
      const payload: Record<string, any> = {
        post: postData.post,
        platforms: postData.platforms,
        mediaUrls: postData.mediaUrls || [],
        scheduleDate: postData.scheduleDate,
        // only include profiles if provided and non-empty
        title: postData.title,
      }
      if (postData.profiles && postData.profiles.length > 0) {
        payload.profiles = postData.profiles
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
      }, profileKey, postData.idempotencyKey)

      return {
        success: true,
        id: data.id,
        refId: data.refId,
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
  async deletePost(postId: string, profileKey?: string): Promise<boolean> {
    try {
      // Docs: DELETE /api/post with body { id }
      await this.makeRequest(`/post`, {
        method: 'DELETE',
        body: JSON.stringify({ id: postId })
      }, profileKey)
      return true
    } catch (error) {
      console.error('Failed to delete post:', error)
      return false
    }
  }

  // Update a scheduled post
  async updatePost(postId: string, updates: Partial<AyrsharePostData>, profileKey?: string): Promise<boolean> {
    try {
      // Docs pattern: PUT /api/post with body including id and fields to update
      const payload: Record<string, any> = { id: postId, ...updates }
      await this.makeRequest(`/post`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }, profileKey)
      return true
    } catch (error) {
      console.error('Failed to update post:', error)
      return false
    }
  }
}

export const ayrshareService = new AyrshareService()
export default ayrshareService
