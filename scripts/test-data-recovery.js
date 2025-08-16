#!/usr/bin/env node

/**
 * Data Recovery Test Script
 * 
 * This script tests the data recovery endpoint to ensure it can properly
 * fetch all gym records and send them to the webhook.
 * 
 * Usage:
 * 1. First, test with dry run: node scripts/test-data-recovery.js
 * 2. Then, run actual recovery: node scripts/test-data-recovery.js --live
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'https://content-approval-app-inky.vercel.app';
const WEBHOOK_URL = process.env.ONBOARDING_WEBHOOK_URL || 
                   process.env.ONBOARDING_TEST_WEBHOOK || 
                   'https://contentjoy.app.n8n.cloud/webhook-test/156ef9a5-0ae7-4e65-acc1-a27aa533d90a';

async function testDataRecovery() {
  const isLive = process.argv.includes('--live');
  
  console.log('🚀 Testing Data Recovery Endpoint');
  console.log('🌐 Base URL:', BASE_URL);
  console.log('📡 Webhook URL:', WEBHOOK_URL);
  console.log('🔧 Mode:', isLive ? 'LIVE RECOVERY' : 'DRY RUN');
  console.log('');
  
  try {
    // Test configuration
    const config = {
      webhookUrl: WEBHOOK_URL,
      dryRun: !isLive, // Dry run unless --live flag is passed
      limit: 10, // Start with small batch for testing
      offset: 0
    };
    
    console.log('📤 Sending recovery request...');
    console.log('📊 Config:', JSON.stringify(config, null, 2));
    console.log('');
    
    const response = await fetch(`${BASE_URL}/api/data-recovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ContentJoy-DataRecovery-Test/1.0'
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Recovery request failed:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('✅ Recovery completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log('📊 - Total gyms processed:', result.summary.total_gyms);
    console.log('📊 - Successful webhooks:', result.summary.successful_webhooks);
    console.log('📊 - Failed webhooks:', result.summary.failed_webhooks);
    console.log('📊 - Dry run:', result.summary.dry_run);
    console.log('');
    
    if (result.results && result.results.length > 0) {
      console.log('🔍 Sample Results:');
      result.results.slice(0, 3).forEach((gym, index) => {
        console.log(`\n${index + 1}. ${gym.gym_name || 'Unknown Gym'}`);
        console.log(`   - ID: ${gym.gym_id}`);
        console.log(`   - Status: ${gym.status}`);
        if (gym.status === 'success') {
          console.log(`   - Webhook: ✅ Success`);
        } else if (gym.status === 'dry_run') {
          console.log(`   - Webhook: 🔍 Dry Run (would send)`);
        } else {
          console.log(`   - Error: ${gym.error}`);
        }
      });
      
      if (result.results.length > 3) {
        console.log(`\n... and ${result.results.length - 3} more gyms`);
      }
    }
    
    console.log('');
    console.log('🎯 Next Steps:');
    if (!isLive) {
      console.log('1. ✅ Dry run completed - review results above');
      console.log('2. 🔄 To run actual recovery: node scripts/test-data-recovery.js --live');
      console.log('3. 📊 Check your N8N webhook executions');
    } else {
      console.log('1. ✅ Live recovery completed!');
      console.log('2. 📊 Check your N8N webhook executions');
      console.log('3. 🔍 Monitor Vercel logs for any errors');
      console.log('4. 📈 Verify all client data is now in your automation system');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('💡 Make sure the app is running and accessible');
  }
}

// Run the test
testDataRecovery();
