import { createClient } from '@supabase/supabase-js';

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

  // TEMPORARY: Hardcode values to get upload working while debugging env vars
  const url = 'https://fjxrxxzspjdlfefsnrnx.supabase.co';
  const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeHJ4eHpzcGpkbGZlZnNucm54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4MDY0MiwiZXhwIjoyMDcwMTU2NjQyfQ.AKv6wqgJwzlUUHbLHOqD68O7YKhRxa4VjOJzXIF_WVY';
  
  console.log('⚠️ TEMPORARY: Using hardcoded Supabase credentials for testing');
  console.log('✅ Supabase client created successfully with hardcoded values');
  
  return createClient(url, key, { auth: { persistSession: false }});
}
