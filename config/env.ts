// config/env.ts
export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://exkjamginzvjzjhmnnpx.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4a2phbWdpbnp2anpqaG1ubnB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MzMxNDIsImV4cCI6MjA2NTEwOTE0Mn0.E3y0nfRgvqD1-QuVG-Bf1v0AmH750KvqHy5BcqdZYv0',
  APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Roshni Solar',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.1',
};

// Check if environment variables are properly set
export const isEnvConfigured = () => {
  // Check if we have valid Supabase URL and key
  const hasValidUrl = ENV.SUPABASE_URL && 
                     ENV.SUPABASE_URL !== '' && 
                     ENV.SUPABASE_URL.startsWith('https://');
  
  const hasValidKey = ENV.SUPABASE_ANON_KEY && 
                     ENV.SUPABASE_ANON_KEY !== '' && 
                     ENV.SUPABASE_ANON_KEY.startsWith('eyJ');
  
  const isConfigured = hasValidUrl && hasValidKey;
  
  // Only show error if we don't have valid credentials
  if (!isConfigured) {
    console.error('❌ Supabase environment variables not configured!');
    console.error('📝 Please create a .env file in the project root with:');
    console.error('EXPO_PUBLIC_SUPABASE_URL=your_actual_supabase_url');
    console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key');
    console.error('🔗 Get these from your Supabase project settings');
    console.error('💡 Current values:');
    console.error('   URL:', ENV.SUPABASE_URL);
    console.error('   Key configured:', !!ENV.SUPABASE_ANON_KEY);
  } else {
    console.log('✅ Supabase environment configured successfully');
    console.log('🔗 URL:', ENV.SUPABASE_URL);
    console.log('🔑 Key configured:', !!ENV.SUPABASE_ANON_KEY);
  }
  
  return isConfigured;
}; 