# AAB Update Guide - Roshni Solar App

This guide explains how to create AAB (Android App Bundle) files that properly update existing apps.

## Key Requirements for Proper App Updates

### 1. **Consistent Application ID** ✅
- Your app ID is: `com.roshnisolar.app`
- This must NEVER change between updates

### 2. **Proper Version Management** ✅
- **Version Code**: Must be incremented for each update
- **Version Name**: User-visible version (e.g., "1.0.1")

### 3. **Consistent Signing** ⚠️
- Currently using debug keystore for release builds
- **IMPORTANT**: Create a release keystore before publishing to Play Store

### 4. **AAB Build Configuration** ✅
- Production builds now configured to generate AAB files

## How to Build AAB for Updates

### Method 1: Using EAS Build (Recommended)

```bash
# Build AAB for production
eas build --platform android --profile production

# Build APK for testing
eas build --platform android --profile preview
```

### Method 2: Manual Version Update + Build

```bash
# 1. Update version (increment version code)
node scripts/update-version.js "1.0.1"

# 2. Build AAB
cd android
./gradlew bundleRelease

# 3. Find AAB file at:
# android/app/build/outputs/bundle/release/app-release.aab
```

## Version Management

### Current Version
- Version Name: "1.0.0"
- Version Code: 1

### To Update Version
```bash
# Increment version name and auto-increment version code
node scripts/update-version.js "1.0.1"

# Or specify both version name and code
node scripts/update-version.js "1.0.1" 2
```

## Important Notes

### 1. **Signing Requirements**
- **For Testing**: Current debug keystore works fine
- **For Play Store**: Must create and use a release keystore
- **Never lose your release keystore** - you can't update the app without it

### 2. **Version Code Rules**
- Must be a positive integer
- Must be higher than the previous version
- EAS can auto-increment this for you

### 3. **AAB vs APK**
- **AAB**: Required for Play Store, smaller download size
- **APK**: Good for testing, direct installation

### 4. **Update Process**
1. Update your code
2. Increment version code
3. Build AAB
4. Upload to Play Store
5. Users get automatic updates

## Creating Release Keystore (For Production)

```bash
# Generate release keystore
keytool -genkey -v -keystore android/app/release-key.keystore -alias roshnisolar-key -keyalg RSA -keysize 2048 -validity 10000

# Then update android/app/build.gradle with:
# storeFile file('release-key.keystore')
# storePassword System.getenv("KEYSTORE_PASSWORD")
# keyAlias System.getenv("KEY_ALIAS")
# keyPassword System.getenv("KEY_PASSWORD")
```

## Troubleshooting

### App Won't Update
- Check version code is higher than installed version
- Ensure same application ID
- Verify signing is consistent

### Build Errors
- Clean build: `cd android && ./gradlew clean`
- Clear cache: `npx expo start --clear`

### AAB Too Large
- Enable ProGuard: `android.enableProguardInReleaseBuilds=true`
- Enable resource shrinking: `android.enableShrinkResourcesInReleaseBuilds=true` 