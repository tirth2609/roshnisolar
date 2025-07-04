// scripts/test-app.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Roshni Solar App Configuration...\n');

// Check if key files exist
const requiredFiles = [
  'app/_layout.tsx',
  'app/login.tsx',
  'contexts/AuthContext.tsx',
  'contexts/DataContext.tsx',
  'lib/supabase.ts',
  'config/env.ts',
  'package.json'
];

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['expo', 'react-native', '@supabase/supabase-js'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json');
}

// Check if node_modules exists
console.log('\n📦 Checking node_modules:');
if (fs.existsSync('node_modules')) {
  console.log('✅ node_modules directory exists');
} else {
  console.log('❌ node_modules missing - run npm install');
}

// Test environment configuration
console.log('\n🔧 Testing environment configuration:');
try {
  const envConfig = require('../config/env.ts');
  console.log('✅ Environment config loaded');
  console.log(`📱 App Name: ${envConfig.ENV.APP_NAME}`);
  console.log(`🔗 Supabase URL: ${envConfig.ENV.SUPABASE_URL}`);
  console.log(`🔑 Environment configured: ${envConfig.isEnvConfigured()}`);
} catch (error) {
  console.log('❌ Error loading environment config:', error.message);
}

console.log('\n🎯 App Configuration Test Complete!');
console.log('\n📱 To start the app:');
console.log('   npm run dev');
console.log('\n📱 To connect Android device:');
console.log('   1. Install Expo Go from Play Store');
console.log('   2. Scan QR code from terminal');
console.log('   3. Use demo credentials to login'); 