// lib/supabase.ts
import 'react-native-url-polyfill/auto'; // Ensures URL polyfills for React Native
import { createClient } from '@supabase/supabase-js';
import { ENV, isEnvConfigured } from '../config/env';

// Check if environment is properly configured
if (!isEnvConfigured()) {
  console.error('❌ Supabase environment variables not configured!');
  console.error('📝 Please create a .env file in the project root with:');
  console.error('EXPO_PUBLIC_SUPABASE_URL=your_actual_supabase_url');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key');
  console.error('🔗 Get these from your Supabase project settings');
  console.error('💡 You can find these in your Supabase Dashboard > Settings > API');
}

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

// Create Supabase client with error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // We're using custom session management
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    // Don't test if environment is not configured
    if (!isEnvConfigured()) {
      console.log('⚠️ Skipping connection test - environment not configured');
      return false;
    }

    console.log('🔍 Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key configured:', !!supabaseAnonKey);

    const { data, error } = await supabase.from('app_users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
      console.error('💡 Make sure your Supabase project is set up correctly');
      console.error('💡 Check that your Edge Functions are deployed');
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection test error:', error);
    return false;
  }
};