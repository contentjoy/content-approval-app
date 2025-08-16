'use client'

import { useState } from 'react'
import { useBranding } from '@/contexts/branding-context'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'

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
                      ? 'bg-[var(--brand-primary)] text-white'
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
            {activeTab === 'integrations' && <IntegrationSettings />}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent"
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
              className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
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
              className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
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
              <div className="w-10 h-10 bg-[var(--brand-primary)] bg-opacity-10 rounded-full flex items-center justify-center">
                <span className="text-[var(--brand-primary)] font-semibold">
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
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
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
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
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
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
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
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
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
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
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
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
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

function IntegrationSettings() {
  const [integrations] = useState([
    { id: 'instagram', name: 'Instagram', connected: true, icon: '📷' },
    { id: 'facebook', name: 'Facebook', connected: false, icon: '📘' },
    { id: 'twitter', name: 'Twitter', connected: false, icon: '🐦' },
    { id: 'tiktok', name: 'TikTok', connected: false, icon: '🎵' },
    { id: 'linkedin', name: 'LinkedIn', connected: false, icon: '💼' }
  ])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Social Media Integrations</h2>
      
      <div className="space-y-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="text-2xl">{integration.icon}</span>
              <div>
                <div className="font-medium text-gray-900">{integration.name}</div>
                <div className="text-sm text-gray-500">
                  {integration.connected ? 'Connected' : 'Not connected'}
                </div>
              </div>
            </div>
            <BrandedButton
              variant={integration.connected ? 'outline' : 'default'}
              size="sm"
            >
              {integration.connected ? 'Disconnect' : 'Connect'}
            </BrandedButton>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">API Keys</h3>
        <p className="text-sm text-gray-600 mb-4">
          Manage your API keys for third-party integrations.
        </p>
        <BrandedButton variant="outline" size="sm">
          Manage API Keys
        </BrandedButton>
      </div>
    </div>
  )
}
