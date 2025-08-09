// Agency types
export interface Agency {
  id: string
  "Partner name": string
  "Logo": string | null
  "Primary Color": string | null
  "Passcode": string | null
}

// Gym types
export interface Gym {
  id: string
  gym_id: string
  "Gym Name": string
  "Agency": string
  "Email": string
  "Primary color": string | null
  "First name": string
  "Last name": string
  "Status": string
  "passcode"?: string | null
  "social_accounts"?: {
    facebook?: { page_id: string; access_token: string; connected_at: string }
    instagram?: { account_id: string; access_token: string; connected_at: string }
    tiktok?: { account_id: string; access_token: string; connected_at: string }
    twitter?: { account_id: string; access_token: string; connected_at: string }
    linkedin?: { account_id: string; access_token: string; connected_at: string }
    youtube?: { channel_id: string; access_token: string; connected_at: string }
  } | null
  "ayrshare_profiles"?: {
    facebook?: { profile_key: string; platform_id: string; platform_username?: string }
    instagram?: { profile_key: string; platform_id: string; platform_username?: string }
    tiktok?: { profile_key: string; platform_id: string; platform_username?: string }
    twitter?: { profile_key: string; platform_id: string; platform_username?: string }
    linkedin?: { profile_key: string; platform_id: string; platform_username?: string }
    youtube?: { profile_key: string; platform_id: string; platform_username?: string }
  } | null
}

// Social Media Post types
export interface SocialMediaPost {
  id: string
  gym_id: string
  "Asset URL": string
  "Post Caption": string | null
  "Approval Status": string
  "Carousel Group": string | null
  "Carousel Order": number | null
  "Asset Type": string | null
  "Content Type": string | null
  "Gym Name": string
  "Scheduled"?: string | null // scheduled_date timestamp
  created_at?: string
  updated_at?: string
}

// Discovery types
export interface Discovery {
  id: string
  title: string
  link: string
  month: string
}

// User Session types
export interface UserSession {
  id: string
  user_id: string // references gyms(gym_id)
  session_token: string
  expires_at: string
  created_at?: string
  updated_at?: string
}

// Authentication types
export interface AuthUser {
  gymId: string
  gymName: string
  agency: string
  primaryColor?: string | null
  socialAccounts?: Gym['social_accounts']
  ayrshareProfiles?: Gym['ayrshare_profiles']
}

// Ayrshare types
export interface AyrshareProfile {
  id: string
  type: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube'
  username?: string
  name?: string
  url?: string
}

export interface AyrsharePostData {
  post: string
  platforms: string[]
  mediaUrls?: string[]
  scheduleDate?: string
  profiles?: string[]
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: Agency
        Insert: Omit<Agency, 'id'>
        Update: Partial<Omit<Agency, 'id'>>
      }
      gyms: {
        Row: Gym
        Insert: Omit<Gym, 'id'>
        Update: Partial<Omit<Gym, 'id'>>
      }
      social_media_posts: {
        Row: SocialMediaPost
        Insert: Omit<SocialMediaPost, 'id'>
        Update: Partial<Omit<SocialMediaPost, 'id'>>
      }
      discovery: {
        Row: Discovery
        Insert: Omit<Discovery, 'id'>
        Update: Partial<Omit<Discovery, 'id'>>
      }
      user_sessions: {
        Row: UserSession
        Insert: Omit<UserSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserSession, 'id'>>
      }
    }
  }
}
