#!/usr/bin/env node

/**
 * Local Database Test Script
 * 
 * This script will test the database connection locally to see what columns
 * actually exist in your gyms table.
 */

// Load environment variables
require('dotenv').config();

async function testLocalDatabase() {
  console.log('🔍 Testing local database connection...');
  
  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables:');
      console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
      console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
      return;
    }
    
    console.log('✅ Environment variables loaded');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');
    
    // Test 1: Check if we can connect
    console.log('\n🔍 Test 1: Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('gyms')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    
    console.log('✅ Connection successful');
    console.log('📊 Test data:', testData);
    
    // Test 2: Check what columns exist
    console.log('\n🔍 Test 2: Checking table structure...');
    
    // Try to select all possible columns
    const { data: gyms, error: structureError } = await supabase
      .from('gyms')
      .select(`
        id,
        "Gym Name",
        "Email",
        "First name",
        "Last name",
        "Phone",
        "Website",
        "City",
        "Address",
        "Primary color",
        "Brand Profile",
        "Target Demographic",
        "Offerings",
        "Clients Desired Result",
        "Google Map URL",
        "Instagram URL",
        "Primary offer",
        "Client Info",
        "White Logo URL",
        "Black Logo URL",
        "Status",
        created_at,
        updated_at
      `)
      .limit(3);
    
    if (structureError) {
      console.error('❌ Structure test failed:', structureError);
      
      // Try to get more details about the error
      if (structureError.code === '42703') {
        console.log('\n💡 This is a column missing error. Let me try a different approach...');
        
        // Test 3: Try to get column info
        console.log('\n🔍 Test 3: Trying to get column information...');
        
        // Try a minimal select to see what works
        const { data: minimalData, error: minimalError } = await supabase
          .from('gyms')
          .select('*')
          .limit(1);
        
        if (minimalError) {
          console.error('❌ Even minimal select failed:', minimalError);
        } else {
          console.log('✅ Minimal select worked');
          console.log('📊 Available columns:', Object.keys(minimalData[0] || {}));
        }
      }
      
      return;
    }
    
    console.log('✅ Structure test successful');
    console.log('📊 Sample gym data:', JSON.stringify(gyms, null, 2));
    
    // Test 4: Count total records
    console.log('\n🔍 Test 4: Counting total records...');
    const { count, error: countError } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Count failed:', countError);
    } else {
      console.log(`✅ Total gyms in database: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testLocalDatabase();
