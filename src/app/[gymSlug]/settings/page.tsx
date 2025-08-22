'use client'

import { useState, useEffect } from 'react'
import { useBranding } from '@/contexts/branding-context'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { useParams } from 'next/navigation'
import { getGymBySlug } from '@/lib/database'
import { useToast } from '@/components/ui/toast'

type TabType = 'general' | 'team' | 'notifications' | 'integrations'

export default function SettingsPage() {
  const { gymName } = useBranding()
  const [activeTab, setActiveTab] = useState<TabType>('general')

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Logo size="lg" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Settings
            </h1>
            <p className="text-gray-600">
              {gymName ? `${gymName} • ` : ''}Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--surface)] rounded-lg shadow-sm border p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Settings</h2>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-[var(--surface)] rounded-lg shadow-sm border">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'team' && <TeamSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'integrations' && <AyrshareIntegrationSettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

function GeneralSettings() {
  const { gymName } = useBranding()
  const [settings, setSettings] = useState({
    gymName: gymName || '',
    email: '',
    timezone: 'UTC',
    language: 'en',
    autoPublish: false,
    approvalRequired: true
  })

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">General Settings</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gym Name
          </label>
          <input
            type="text"
            value={settings.gymName}
            onChange={(e) => setSettings(prev => ({ ...prev, gymName: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>

        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.autoPublish}
              onChange={(e) => setSettings(prev => ({ ...prev, autoPublish: e.target.checked }))}
              className="text-primary focus:ring-ring"
            />
            <div>
              <div className="font-medium text-gray-900">Auto-publish approved content</div>
              <div className="text-sm text-gray-500">Automatically publish content once approved</div>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.approvalRequired}
              onChange={(e) => setSettings(prev => ({ ...prev, approvalRequired: e.target.checked }))}
              className="text-primary focus:ring-ring"
            />
            <div>
              <div className="font-medium text-gray-900">Require approval for all content</div>
              <div className="text-sm text-gray-500">All content must be approved before publishing</div>
            </div>
          </label>
        </div>

        <div className="pt-6 border-t">
          <BrandedButton>
            Save Changes
          </BrandedButton>
        </div>
      </div>
    </div>
  )
}

function TeamSettings() {
  const [teamMembers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'approver', status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'creator', status: 'pending' }
  ])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
        <BrandedButton size="sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Member
        </BrandedButton>
      </div>

      <div className="space-y-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="font-medium text-gray-900">{member.name}</div>
                <div className="text-sm text-gray-500">{member.email}</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {member.status}
              </span>
              <span className="text-sm text-gray-500 capitalize">{member.role}</span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    approvalRequests: true,
    contentPublished: true,
    weeklyReports: false,
    dailyDigest: true
  })

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-sm text-gray-500">Receive notifications via email</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailNotifications}
                onChange={(e) => setNotifications(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="text-primary focus:ring-ring"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Push Notifications</div>
                <div className="text-sm text-gray-500">Receive notifications in your browser</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.pushNotifications}
                onChange={(e) => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                className="text-primary focus:ring-ring"
              />
            </label>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-4">Notification Types</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Approval Requests</div>
                <div className="text-sm text-gray-500">When content needs your approval</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.approvalRequests}
                onChange={(e) => setNotifications(prev => ({ ...prev, approvalRequests: e.target.checked }))}
                className="text-primary focus:ring-ring"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Content Published</div>
                <div className="text-sm text-gray-500">When content is published</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.contentPublished}
                onChange={(e) => setNotifications(prev => ({ ...prev, contentPublished: e.target.checked }))}
                className="text-primary focus:ring-ring"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Weekly Reports</div>
                <div className="text-sm text-gray-500">Weekly performance summaries</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.weeklyReports}
                onChange={(e) => setNotifications(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                className="text-primary focus:ring-ring"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Daily Digest</div>
                <div className="text-sm text-gray-500">Daily summary of activity</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.dailyDigest}
                onChange={(e) => setNotifications(prev => ({ ...prev, dailyDigest: e.target.checked }))}
                className="text-primary focus:ring-ring"
              />
            </label>
          </div>
        </div>

        <div className="pt-6 border-t">
          <BrandedButton>
            Save Notification Settings
          </BrandedButton>
        </div>
      </div>
    </div>
  )
}

function AyrshareIntegrationSettings() {
  const { showToast } = useToast()
  const { gymSlug } = useParams()
  const [gymId, setGymId] = useState<string | null>(null)
  const [profileKey, setProfileKey] = useState<string | null>(null)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingGymData, setIsLoadingGymData] = useState(true) // New state for gym data loading

  // Load gym data on component mount
  useEffect(() => {
    console.log('🚀 AyrshareIntegrationSettings component mounted')
    console.log('🚀 Initial gymSlug:', gymSlug)
    console.log('🚀 Initial gymId state:', gymId)
    
    const loadGymData = async () => {
      console.log('🔍 Loading gym data for slug:', gymSlug)
      console.log('🔍 gymSlug type:', typeof gymSlug)
      console.log('🔍 gymSlug value:', gymSlug)
      
      if (!gymSlug) {
        console.log('❌ No gymSlug available')
        setIsLoadingGymData(false)
        return
      }
      
      try {
        // Convert slug to gym name (e.g., "kokoro-demo" -> "kokoro demo")
        const gymName = gymSlug.toString().replace(/-/g, ' ')
        console.log('🔍 Looking for gym with name:', gymName)
        
        console.log('🔍 Calling getGymBySlug with:', gymSlug.toString())
        const gym = await getGymBySlug(gymSlug.toString())
        console.log('🔍 getGymBySlug result:', gym)

        if (gym) {
          console.log('✅ Found gym:', { id: gym.id, name: gym['Gym Name'] })
          console.log('✅ Setting gymId to:', gym.id)
          setGymId(gym.id) // gym.id is the primary key from the gyms table
          
          // Extract connected platforms from ayrshare_profiles
          if (gym.ayrshare_profiles) {
            const platforms = Object.keys(gym.ayrshare_profiles).filter(
              platform => gym.ayrshare_profiles![platform as keyof typeof gym.ayrshare_profiles]?.profile_key
            )
            console.log('🔗 Connected platforms:', platforms)
            setConnectedPlatforms(platforms)
          } else {
            console.log('ℹ️ No ayrshare_profiles found')
          }
        } else {
          console.log('ℹ️ Gym not found with slug:', gymSlug)
          setError('Gym not found. Please ensure the gym slug is correct.')
        }
      } catch (err) {
        console.error('❌ Failed to load gym data:', err)
        setError('Failed to load gym data')
      } finally {
        setIsLoadingGymData(false)
      }
    }

    loadGymData()
  }, [gymSlug])

  // Debug effect to track state changes
  useEffect(() => {
    console.log('🔄 gymId state changed to:', gymId)
  }, [gymId])

  useEffect(() => {
    console.log('🔄 profileKey state changed to:', profileKey)
  }, [profileKey])

  // Auto-load profile data when gymId is set
  useEffect(() => {
    if (gymId && !profileKey) {
      console.log('🔄 gymId set, auto-loading profile data...')
      loadExistingAccounts()
    }
  }, [gymId, profileKey])

  const handleConnectPlatform = async (platform: string) => {
    if (!gymId) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Gym ID not found. Please refresh the page.',
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Open Ayrshare auth popup
      const authUrl = `https://app.ayrshare.com/auth/url?platform=${platform}&redirect=${encodeURIComponent(`${window.location.origin}/api/ayrshare/callback`)}&state=${gymId}-${platform}`
      
      const popup = window.open(authUrl, 'ayrshare-auth', 'width=600,height=700,scrollbars=yes,resizable=yes')
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.')
      }

      // Listen for auth success/failure
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'AYRSHARE_AUTH_SUCCESS') {
          if (event.data.platform === platform) {
            setConnectedPlatforms(prev => [...prev, platform])
            showToast({
              type: 'success',
              title: `${platform} Connected!`,
              message: `Your ${platform} account has been successfully connected.`,
            })
            popup.close()
            window.removeEventListener('message', messageHandler)
          }
        } else if (event.data?.type === 'AYRSHARE_AUTH_ERROR') {
          setError(event.data.error || 'Authentication failed')
          showToast({
            type: 'error',
            title: 'Connection Failed',
            message: event.data.error || 'Failed to connect to Ayrshare.',
          })
          popup.close()
          window.removeEventListener('message', messageHandler)
        }
      }

      window.addEventListener('message', messageHandler)

      // Cleanup if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
        }
      }, 1000)

    } catch (err) {
      console.error('Failed to connect platform:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect platform')
      showToast({
        type: 'error',
        title: 'Connection Failed',
        message: err instanceof Error ? err.message : 'Failed to connect platform',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Get profile key and gym ID from database
  const getProfileKey = async (): Promise<{ profileKey: string | null; gymId: string | null }> => {
    if (!gymId) {
      console.log('❌ getProfileKey: No gymId available')
      return { profileKey: null, gymId: null }
    }

    try {
      console.log('🔍 getProfileKey: Fetching profile for gymId:', gymId)
      
      const response = await fetch(`/api/gym-profile?gymId=${gymId}`)
      const data = await response.json()
      
      console.log('🔍 getProfileKey: API response:', data)
      
      if (data.success) {
        console.log('✅ getProfileKey: Successfully got profile data:', { 
          profileKey: data.profile_key, 
          gymId: data.gym_id || gymId 
        })
        return { 
          profileKey: data.profile_key, 
          gymId: data.gym_id || gymId 
        }
      } else {
        console.error('❌ getProfileKey: API error:', data.error)
        return { profileKey: null, gymId: null }
      }
    } catch (error) {
      console.error('❌ getProfileKey: Request failed:', error)
      return { profileKey: null, gymId: null }
    }
  }

  const handleSyncProfiles = async () => {
    console.log('🔄 handleSyncProfiles called')
    console.log('🔄 Current gymId state:', gymId)
    console.log('🔄 Current profileKey state:', profileKey)
    
    if (!gymId) {
      console.error('❌ Cannot sync profiles: gymId is undefined')
      console.log('🔄 Attempting to reload profile data...')
      
      // Try to reload the profile data
      await loadExistingAccounts()
      
      // Check again after reload
      if (!gymId) {
              showToast({
        type: 'error',
        title: 'Error',
        message: 'Gym ID not loaded. Please refresh the page.',
      })
        return
      }
    }
    
    if (!profileKey) {
      console.error('❌ Cannot sync profiles: profileKey is undefined')
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Profile key not found. Please complete onboarding first.',
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🔄 Calling sync-profiles API with:', { gymId, profileKey })
      
      const response = await fetch('/api/ayrshare/sync-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gymId, profileKey }),
      })

      const result = await response.json()
      console.log('🔄 sync-profiles API response:', result)

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Profiles synced successfully!',
          message: 'Your social media profiles have been successfully synced.',
        })
        // Refresh the connected platforms
        await loadExistingAccounts()
      } else {
        console.error('❌ sync-profiles API error:', result)
        setError(result.error || 'Failed to sync profiles')
        showToast({
          type: 'error',
          title: 'Sync Failed',
          message: result.error || 'Failed to sync profiles',
        })
      }
    } catch (error) {
      console.error('❌ sync-profiles request failed:', error)
      setError('Network error occurred')
      showToast({
        type: 'error',
        title: 'Sync Failed',
        message: 'Network error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load existing connected accounts from database
  const loadExistingAccounts = async () => {
    console.log('🔄 loadExistingAccounts called')
    console.log('🔄 Current gymId state:', gymId)
    
    if (!gymId) {
      console.log('❌ loadExistingAccounts: No gymId available')
      return
    }

    try {
      console.log('🔄 Getting profile data for gymId:', gymId)
      const { profileKey: newProfileKey, gymId: newGymId } = await getProfileKey()
      
      console.log('🔄 Profile data result:', { newProfileKey, newGymId })
      
      // Update both profileKey and gymId from the same database record
      if (newProfileKey) {
        console.log('✅ Setting profileKey to:', newProfileKey)
        setProfileKey(newProfileKey)
      }
      
      if (newGymId) {
        console.log('✅ Setting gymId to:', newGymId)
        setGymId(newGymId)
      }
      
      // Now fetch the gym data to get ayrshare_profiles
      const gym = await getGymBySlug(gymSlug?.toString() || '')
      if (gym && gym.ayrshare_profiles) {
        const platforms = Object.keys(gym.ayrshare_profiles).filter(
          platform => gym.ayrshare_profiles![platform as keyof typeof gym.ayrshare_profiles]?.profile_key
        )
        console.log('🔗 Connected platforms:', platforms)
        setConnectedPlatforms(platforms)
      }
      
    } catch (error) {
      console.error('❌ loadExistingAccounts failed:', error)
    }
  }

  // Load existing accounts when gymId becomes available
  useEffect(() => {
    if (gymId) {
      loadExistingAccounts()
    }
  }, [gymId])

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  ]

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Ayrshare Integration</h2>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">Connection Status</h3>
          <BrandedButton
            onClick={loadExistingAccounts}
            disabled={!gymId || isLoadingGymData}
            size="sm"
            variant="outline"
          >
            🔄 Refresh
          </BrandedButton>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${profileKey ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {profileKey ? 'Ayrshare Profile Connected' : 'No Ayrshare Profile'}
            </span>
          </div>
          {profileKey && (
            <span className="text-xs text-gray-500 font-mono bg-gray-200 px-2 py-1 rounded">
              {profileKey}
            </span>
          )}
        </div>
        {gymId && (
          <div className="mt-2 text-xs text-gray-500">
            Gym ID: {gymId}
          </div>
        )}
        {!gymId && (
          <div className="mt-2 text-xs text-red-500">
            ⚠️ Gym ID not loaded. Please refresh the page.
          </div>
        )}
      </div>

      {/* Platform Connections */}
      <div className="space-y-4 mb-6">
        <h3 className="font-medium text-gray-900">Social Media Platforms</h3>
        {platforms.map((platform) => {
          const isConnected = connectedPlatforms.includes(platform.id)
          return (
            <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{platform.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{platform.name}</div>
                  <div className="text-sm text-gray-500">
                    {isConnected ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
              <BrandedButton
                onClick={() => handleConnectPlatform(platform.id)}
                disabled={isLoading || !profileKey}
                variant={isConnected ? 'outline' : 'default'}
                size="sm"
              >
                {isLoading ? 'Connecting...' : isConnected ? 'Reconnect' : 'Connect'}
              </BrandedButton>
            </div>
          )
        })}
      </div>

      {/* Sync Button */}
      {profileKey && connectedPlatforms.length > 0 && (
        <div className="mb-6">
          <BrandedButton
            onClick={handleSyncProfiles}
            disabled={isLoading || !gymId}
            className="w-full"
          >
            {isLoading ? 'Syncing...' : 'Sync Social Media Profiles'}
          </BrandedButton>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
        <p className="text-sm text-blue-700 mb-2">
          Connect your social media accounts to Ayrshare to automatically sync content and manage your social media presence.
        </p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Connect individual platforms (Instagram, Facebook, Twitter, etc.)</li>
          <li>• Sync your profiles to get the latest connection status</li>
          <li>• Manage all your social media accounts in one place</li>
        </ul>
      </div>

      {/* Debug Information */}
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border">
        <h4 className="font-semibold text-sm mb-2">🔍 Debug Info</h4>
        <div className="text-xs space-y-1">
          <div>gymSlug: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{gymSlug || 'undefined'}</code></div>
          <div>gymId: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{gymId || 'undefined'}</code></div>
          <div>profileKey: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{profileKey ? 'loaded' : 'undefined'}</code></div>
          <div>Loading Gym Data: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{isLoadingGymData ? 'true' : 'false'}</code></div>
          <div>Connected Platforms: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{connectedPlatforms.length}</code></div>
        </div>
      </div>
    </div>
  )
}
