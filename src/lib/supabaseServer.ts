import { createClient } from '@supabase/supabase-js';

export function getAdminClient() {
  // Debug environment variables
  console.log('🔍 Environment variables check:', {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  });

  // Try to get URL from multiple sources
  let url = process.env.SUPABASE_URL;
  if (!url) {
    console.log('⚠️ SUPABASE_URL not found, trying NEXT_PUBLIC_SUPABASE_URL');
    url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.error('❌ Missing environment variables:', { 
      url: url ? 'FOUND' : 'MISSING', 
      key: key ? 'FOUND' : 'MISSING',
      urlSource: process.env.SUPABASE_URL ? 'SUPABASE_URL' : 
                 process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : 'NONE'
    });
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  console.log('✅ Supabase client created successfully with URL from:', 
    process.env.SUPABASE_URL ? 'SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL');
  return createClient(url, key, { auth: { persistSession: false }});
}
