'use client'

import { useState } from 'react'
import { BrandedButton } from '@/components/ui/branded-button'

import { supabase } from '@/lib/supabase'

// Tailwind CSS Test Component
function TailwindTest() {
  return (
    <div className="p-4 mb-4 bg-blue-500 text-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2">🎨 Tailwind CSS Test</h2>
      <p className="text-blue-100">
        If you can see this styled box with blue background, white text, and rounded corners, 
        then Tailwind CSS is working properly!
      </p>
      <div className="mt-3 flex gap-2">
        <button className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md transition-colors">
          Green Button
        </button>
        <button className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md transition-colors">
          Red Button
        </button>
      </div>
    </div>
  )
}

export function TestConnection() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testMovementSocietyPosts = async () => {
    addResult('🔍 Testing posts for "movement society" (lowercase)...')
    
    try {
      // Get exact match with lowercase name
      const { data: exactMatch, error: exactError } = await supabase
        .from('social_media_posts')
        .select('*')
        .eq('"Gym Name"', 'movement society')

      if (exactError) {
        addResult(`❌ Error with exact match: ${exactError.message}`)
        return
      }

      if (exactMatch && exactMatch.length > 0) {
        addResult(`📊 Found ${exactMatch.length} posts for exact match "movement society"`)
      }

      // Show ALL gym names that contain "movement" or "society" (case sensitive)
      const { data: similarNames, error: similarError } = await supabase
        .from('social_media_posts')
        .select('"Gym Name"')
        .or('"Gym Name".like.%movement%,"Gym Name".like.%society%')
        .not('"Gym Name"', 'is', null)

      if (similarError) {
        addResult(`❌ Error searching similar names: ${similarError.message}`)
      } else if (similarNames && similarNames.length > 0) {
        const uniqueNames = [...new Set(similarNames.map(post => post['Gym Name']))]
        addResult('📋 Found similar gym names:')
        uniqueNames.forEach((name, index) => {
          addResult(`   ${index + 1}. "${name}" (exact string)`)
        })
      }

      if (exactMatch && exactMatch.length > 0) {
        // Count by approval status
        const statusCounts = {
          approved: 0,
          disapproved: 0,
          pending: 0,
          null: 0,
          empty: 0,
          other: 0
        }
        
        exactMatch.forEach(post => {
          const status = post['Approval Status']
          if (status === 'Approved') {
            statusCounts.approved++
          } else if (status === 'Disapproved') {
            statusCounts.disapproved++
          } else if (status === 'Pending') {
            statusCounts.pending++
          } else if (status === null || status === undefined) {
            statusCounts.null++
          } else if (status === '') {
            statusCounts.empty++
          } else {
            statusCounts.other++
            addResult(`⚠️  Unknown status: "${status}"`)
          }
        })
        
        addResult('📋 APPROVAL STATUS BREAKDOWN:')
        addResult(`   ✅ Approved: ${statusCounts.approved}`)
        addResult(`   ❌ Disapproved: ${statusCounts.disapproved}`)
        addResult(`   ⏳ Pending: ${statusCounts.pending}`)
        addResult(`   🔍 Null/Undefined: ${statusCounts.null}`)
        addResult(`   📝 Empty string: ${statusCounts.empty}`)
        addResult(`   ❓ Other: ${statusCounts.other}`)
        
        // Show sample posts
        addResult('📝 SAMPLE POSTS (first 3):')
        exactMatch.slice(0, 3).forEach((post, index) => {
          addResult(`   ${index + 1}. ID: ${post.id}`)
          addResult(`      Gym Name: "${post['Gym Name']}" (exact string)`)
          addResult(`      Status: "${post['Approval Status']}"`)
          addResult(`      Asset: ${post['Asset URL']}`)
        })
        
        // Check if gym_id exists
        const hasGymId = exactMatch.some(post => post.gym_id)
        addResult(`🔑 Posts with gym_id: ${hasGymId ? 'Yes' : 'No'}`)
        
        if (hasGymId) {
          const gymIds = [...new Set(exactMatch.map(post => post.gym_id).filter(Boolean))]
          addResult(`   Unique gym_ids: ${gymIds.join(', ')}`)
        }
      } else {
        addResult('⚠️ No posts found for exact match "movement society"')
      }

      // Show ALL unique gym names for reference
      addResult('\n🔍 Getting ALL gym names from database...')
      const { data: allGymNames, error: gymError } = await supabase
        .from('social_media_posts')
        .select('"Gym Name"')
        .not('"Gym Name"', 'is', null)
      
      if (gymError) {
        addResult(`❌ Error getting gym names: ${gymError.message}`)
        addResult(`   Details: ${JSON.stringify(gymError)}`)
      } else if (allGymNames && allGymNames.length > 0) {
        const uniqueNames = [...new Set(allGymNames.map(post => post['Gym Name']))]
        addResult(`📋 Found ${uniqueNames.length} unique gym names:`)
        uniqueNames.forEach((name, index) => {
          if (name.toLowerCase().includes('movement') || name.toLowerCase().includes('society')) {
            addResult(`   ${index + 1}. "${name}" (RELEVANT)`)
          } else {
            addResult(`   ${index + 1}. "${name}"`)
          }
        })
      } else {
        addResult('⚠️ No gym names found in database')
      }
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    setResults([])
    
    try {
      addResult('🔍 Testing Supabase connection...')
      
      // Test basic connection
      const { error } = await supabase.from('gyms').select('count').limit(1)
      
      if (error) {
        addResult(`❌ Connection failed: ${error.message}`)
        return
      }
      
      addResult('✅ Supabase connection successful')
      
      // Test if we can access social_media_posts table
      addResult('🔍 Testing social_media_posts table access...')
      const { count: postCount, error: postError } = await supabase
        .from('social_media_posts')
        .select('*', { count: 'exact', head: true })
      
      if (postError) {
        addResult(`❌ Cannot access social_media_posts: ${postError.message}`)
        return
      } else {
        addResult(`✅ social_media_posts table accessible - Total posts: ${postCount}`)
      }
      
      // Test movement society posts specifically
      await testMovementSocietyPosts()
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Connection Test</h3>
      
      {/* Tailwind CSS Test */}
      <TailwindTest />
      
      <BrandedButton
        onClick={testConnection}
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test Connection'}
      </BrandedButton>
      
      {results.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Test Results:</h4>
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-700">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
