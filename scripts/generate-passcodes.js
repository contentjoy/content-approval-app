/**
 * Script to auto-generate passcodes for existing gym clients
 * This ensures existing clients can access their accounts with the new authentication system
 */

const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = 'https://fjxrxxzspjdlfefsnrnx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeHJ4eHpzcGpkbGZlZnNucm54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4MDY0MiwiZXhwIjoyMDcwMTU2NjQyfQ.AKv6wqgJwzlUUHbLHOqD68O7YKhRxa4VjOJzXIF_WVY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Function to generate a secure but memorable passcode
function generatePasscode() {
  // Generate a 6-character alphanumeric passcode (easy to remember/type)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let passcode = ''
  for (let i = 0; i < 6; i++) {
    passcode += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return passcode
}

// Function to generate passcodes based on gym name (more predictable for clients)
function generateMemorablePasscode(gymName) {
  // Take first 3 letters of gym name + 3 random numbers
  const gymPrefix = gymName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()
  const randomSuffix = Math.floor(100 + Math.random() * 900) // 3-digit number
  return `${gymPrefix}${randomSuffix}`
}

async function generatePasscodesForExistingGyms() {
  try {
    console.log('🔍 Fetching existing gyms without passcodes...')
    
    // Get all gyms that don't have a passcode set
    const { data: gyms, error: fetchError } = await supabase
      .from('gyms')
      .select('*')
      .or('passcode.is.null,passcode.eq.')
    
    if (fetchError) {
      throw fetchError
    }

    if (!gyms || gyms.length === 0) {
      console.log('✅ No gyms found without passcodes. All clients already have passcodes!')
      return
    }

    console.log(`📋 Found ${gyms.length} gyms that need passcodes:`)
    
    const updates = []
    
    for (const gym of gyms) {
      // Generate a memorable passcode based on gym name
      const passcode = generateMemorablePasscode(gym['Gym Name'] || 'GYM')
      
      console.log(`   • ${gym['Gym Name']} (${gym['Email']}) → Passcode: ${passcode}`)
      
      updates.push({
        id: gym.id, // Use 'id' instead of 'gym_id'
        gymName: gym['Gym Name'],
        email: gym['Email'],
        passcode: passcode,
        agency: gym['Agency'] || 'gym-launch'
      })
    }

    console.log('\n🔧 Updating gyms with new passcodes...')
    
    // Update each gym with their new passcode
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('gyms')
        .update({ 
          passcode: update.passcode,
          // Ensure gym name is lowercase for URL compatibility
          'Gym Name': update.gymName.toLowerCase().replace(/[^a-z0-9]/g, '-')
        })
        .eq('id', update.id) // Use 'id' instead of 'gym_id'
      
      if (updateError) {
        console.error(`❌ Failed to update ${update.gymName}:`, updateError)
      } else {
        console.log(`✅ Updated ${update.gymName}`)
      }
    }

    console.log('\n📧 CLIENT CREDENTIALS SUMMARY:')
    console.log('=' .repeat(60))
    console.log('Share these credentials with your clients:\n')
    
    for (const update of updates) {
      console.log(`🏋️  ${update.gymName}`)
      console.log(`   📧 Email: ${update.email}`)
      console.log(`   🔑 Passcode: ${update.passcode}`)
      console.log(`   🌐 Login URL: https://content-approval-app-inky.vercel.app/${update.agency}`)
      console.log(`   🎯 Dashboard: https://content-approval-app-inky.vercel.app/${update.gymName}`)
      console.log('')
    }
    
    console.log('=' .repeat(60))
    console.log('✅ All existing clients now have passcodes and can use the new authentication system!')
    console.log('📝 Save this credentials list to share with your clients.')
    
  } catch (error) {
    console.error('❌ Error generating passcodes:', error)
    process.exit(1)
  }
}

// Export for potential reuse
module.exports = {
  generatePasscodesForExistingGyms,
  generateMemorablePasscode
}

// Run the script if called directly
if (require.main === module) {
  generatePasscodesForExistingGyms()
    .then(() => {
      console.log('\n🎉 Script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}
