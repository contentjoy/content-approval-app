import { createClient } from '@supabase/supabasejs';

export function getAdminClient() {
  // Comprehensive environment variable debugging
  console.log('🔍 FULL Environment variables check:', {
    SUPABASE_URL: process.env.SUPABASE_URL ? `SET (${process.env.SUPABASE_URL.substring(0, 20)}...)` : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `SET (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...)` : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? `SET (${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...)` : 'MISSING',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE')),
    totalEnvVars: Object.keys(process.env).length,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? 'YES' : 'NO',
    vercelEnv: process.env.VERCEL_ENV
  });

  // Try multiple fallback strategies for URL
  let url = process.env.SUPABASE_URL;
  let urlSource = 'SUPABASE_URL';
  
  if (!url) {
    console.log('⚠️ SUPABASE_URL not found, trying NEXT_PUBLIC_SUPABASE_URL');
    url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    urlSource = 'NEXT_PUBLIC_SUPABASE_URL';
  }
  
  if (!url) {
    console.log('⚠️ NEXT_PUBLIC_SUPABASE_URL not found, trying hardcoded fallback');
    // Hardcoded fallback for testing
    url = 'https://fjxrxxzspjdlfefsnrnx.supabase.co';
    urlSource = 'HARDCODED_FALLBACK';
  }
  
  // Try multiple fallback strategies for key
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let keySource = 'SUPABASE_SERVICE_ROLE_KEY';
  
  if (!key) {
    console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, checking for alternatives');
    // Check if we have any Supabase key
    const allKeys = Object.keys(process.env).filter(k => k.includes('SUPABASE') && k.includes('KEY'));
    console.log('🔑 Available Supabase keys:', allKeys);
    
    if (allKeys.length > 0) {
      key = process.env[allKeys[0]];
      keySource = allKeys[0];
      console.log(`⚠️ Using alternative key from: ${keySource}`);
    }
  }
  
  if (!url || !key) {
    console.error('❌ CRITICAL: Missing environment variables after all fallbacks:', { 
      url: url ? 'FOUND' : 'MISSING', 
      key: key ? 'FOUND' : 'MISSING',
      urlSource,
      keySource,
      allEnvVars: Object.keys(process.env).slice(0, 10) // Show first 10 env vars
    });
    throw new Error(`Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. URL: ${!!url}, Key: ${!!key}`);
  }
  
  console.log('✅ Supabase client created successfully:', { 
    urlSource, 
    keySource,
    urlLength: url.length,
    keyLength: key.length
  });
  
  return createClient(url, key, { auth: { persistSession: false }});
}
