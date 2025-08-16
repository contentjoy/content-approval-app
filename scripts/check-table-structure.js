#!/usr/bin/env node

/**
 * Check Table Structure Script
 * 
 * This script will check what columns actually exist in your gyms table
 * so we can fix the data recovery script.
 */

async function checkTableStructure() {
  console.log('🔍 Checking gyms table structure...');
  
  try {
    // Test the data recovery endpoint with a simple query to see what columns exist
    const response = await fetch('https://content-approval-app-inky.vercel.app/api/data-recovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ContentJoy-TableCheck/1.0'
      },
      body: JSON.stringify({
        webhookUrl: 'https://contentjoy.app.n8n.cloud/webhook-test/156ef9a5-0ae7-4e65-acc1-a27aa533d90a',
        dryRun: true,
        limit: 1,
        offset: 0
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Response status:', response.status);
      console.log('📝 Error details:', errorText);
      
      // Try to parse the error to see what column is missing
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.details && errorData.details.message) {
          console.log('🔍 Error message:', errorData.details.message);
          
          if (errorData.details.message.includes('column gyms.slug does not exist')) {
            console.log('💡 SOLUTION: The "slug" column does not exist in your gyms table');
            console.log('💡 We need to use a different column for identification');
          }
        }
      } catch (parseError) {
        console.log('Could not parse error details');
      }
      
      return;
    }
    
    const result = await response.json();
    console.log('✅ Table structure check completed');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkTableStructure();
