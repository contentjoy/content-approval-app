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
    }
  }
}
