#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Roshni Solar - Environment Setup');
console.log('=====================================\n');

const envPath = path.join(__dirname, '..', '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('📝 Please update it with your Supabase credentials:\n');
} else {
  console.log('📝 Creating .env file...\n');
}

const envContent = `# Supabase Configuration
# Replace these with your actual Supabase project credentials
# Get these from: https://supabase.com/dashboard > Settings > API

EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# App Configuration
EXPO_PUBLIC_APP_NAME=Roshni Solar
EXPO_PUBLIC_APP_VERSION=1.0.0

# Instructions:
# 1. Go to https://supabase.com/dashboard
# 2. Select your project (or create one)
# 3. Go to Settings > API
# 4. Copy Project URL to EXPO_PUBLIC_SUPABASE_URL
# 5. Copy anon public key to EXPO_PUBLIC_SUPABASE_ANON_KEY
# 6. Save this file and restart the app
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Open .env file in your project root');
  console.log('2. Replace the placeholder values with your actual Supabase credentials');
  console.log('3. Get credentials from: https://supabase.com/dashboard > Settings > API');
  console.log('4. Run: npm run dev');
  console.log('5. Test with: john@roshni.com / password123');
  console.log('\n🔗 Need help? Check SUPABASE_SETUP.md for detailed instructions');
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
  console.log('\n📝 Please create .env file manually with the content above');
} 