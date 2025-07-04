const fs = require('fs');
const path = require('path');

// Read current version from build.gradle
const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

// Extract current version
const versionCodeMatch = buildGradleContent.match(/versionCode\s+(\d+)/);
const versionNameMatch = buildGradleContent.match(/versionName\s+"([^"]+)"/);

if (!versionCodeMatch || !versionNameMatch) {
  console.error('Could not find version information in build.gradle');
  process.exit(1);
}

const currentVersionCode = parseInt(versionCodeMatch[1]);
const currentVersionName = versionNameMatch[1];

console.log(`Current version: ${currentVersionName} (${currentVersionCode})`);

// Get new version from command line arguments
const newVersionName = process.argv[2];
const newVersionCode = process.argv[3] || (currentVersionCode + 1);

if (!newVersionName) {
  console.log('Usage: node update-version.js <new-version-name> [new-version-code]');
  console.log('Example: node update-version.js "1.0.1"');
  console.log('Example: node update-version.js "1.0.1" 2');
  process.exit(1);
}

// Update build.gradle
const updatedContent = buildGradleContent
  .replace(/versionCode\s+\d+/, `versionCode ${newVersionCode}`)
  .replace(/versionName\s+"[^"]*"/, `versionName "${newVersionName}"`);

fs.writeFileSync(buildGradlePath, updatedContent);

console.log(`Updated version to: ${newVersionName} (${newVersionCode})`);
console.log('✅ Version updated successfully!'); 