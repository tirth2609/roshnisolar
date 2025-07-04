# 🔧 Supabase Setup Guide

## ❌ Current Issue
Your app is not connecting to Supabase because the environment variables are not configured.

## 📝 Step 1: Create Environment File

Create a `.env` file in the project root directory with your Supabase credentials:

```bash
# Create .env file in the project root
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_APP_NAME=Roshni Solar
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## 🔗 Step 2: Get Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one)
3. **Go to Settings > API**
4. **Copy these values**:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🗄️ Step 3: Set Up Database

1. **Go to SQL Editor** in your Supabase Dashboard
2. **Run the complete SQL** from `SETUP.md` to create tables and insert demo data
3. **Deploy Edge Functions**:
   - Go to **Edge Functions** in Supabase Dashboard
   - Deploy the `loginUser` function from `supabase/functions/loginUser/`

## 🚀 Step 4: Test the App

1. **Restart the development server**:
   ```bash
   npm run dev
   ```

2. **Check console logs** for connection status

3. **Test with demo credentials**:
   - Email: `john@roshni.com`
   - Password: `password123`

## 📱 Step 5: Mobile/Web Access

### For Web:
- Open: `http://localhost:8081`

### For Mobile:
- Install **Expo Go** app
- Scan QR code from terminal
- Or use tunnel mode: `npx expo start --tunnel`

## 🔍 Troubleshooting

### If connection fails:
1. **Check environment variables** are correct
2. **Verify Supabase project** is active
3. **Check Edge Functions** are deployed
4. **Look at console logs** for specific errors

### If app shows demo mode:
- Environment variables are not configured
- Follow Step 1 above

### If login fails:
- Check that demo users exist in database
- Run the SQL from `SETUP.md`

## 📞 Demo Users Available

After running the SQL setup, these users will be available:

| Email | Password | Role |
|-------|----------|------|
| john@roshni.com | password123 | Salesman |
| sarah@roshni.com | password123 | Call Operator |
| mike@roshni.com | password123 | Technician |
| admin@roshni.com | password123 | Super Admin |
| raj@roshni.com | password123 | Salesman |
| priya@roshni.com | password123 | Call Operator |
| amit@roshni.com | password123 | Technician |

## ✅ Success Indicators

- ✅ Console shows "✅ Supabase connection successful"
- ✅ Login works with demo credentials
- ✅ App shows real data from Supabase
- ✅ No "demo mode" warnings in console 