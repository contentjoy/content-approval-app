export interface FormData {
  // Business Details
  firstName: string
  lastName: string
  phone: string
  website: string
  city: string
  address: string
  
  // Brand Identity
  brandColor: string
  brandStyle: string
  
  // Audience & Services
  audience: string
  services: string
  results: string
  
  // Links & Socials
  googleMapUrl: string
  instagramUrl: string
  
  // Marketing & Content
  cta: string
  testimonial: string
  
  // Media - now store File objects locally
  whiteLogoFile: File | null
  blackLogoFile: File | null
  whiteLogoUrl: string
  blackLogoUrl: string
}

export const brandStyles = [
  'F45',
  'Peloton',
  'Nike',
  'Orangetheory',
  'CrossFit HQ',
  'Barry\'s',
  'SoulCycle',
  'Equinox',
  'Gymshark',
  'Rumble Boxing'
]

export const steps = [
  { id: 1, title: 'Business Details', icon: 'Building' },
  { id: 2, title: 'Brand Identity', icon: 'Palette' },
  { id: 3, title: 'Audience & Services', icon: 'Users' },
  { id: 4, title: 'Links & Socials', icon: 'LinkIcon' },
  { id: 5, title: 'Marketing & Content', icon: 'Megaphone' },
]
