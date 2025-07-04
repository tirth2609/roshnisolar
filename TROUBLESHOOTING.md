# Roshni Solar App - Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. **Cannot Add Leads**

**Problem:** Salesmen cannot add new leads to the system.

**Solutions:**

1. **Check User Role:**
   - Ensure you're logged in as a salesman
   - Demo account: `john@roshni.com` / `password123`

2. **Check RLS Policies:**
   ```sql
   -- Run this in Supabase SQL Editor
   DROP POLICY IF EXISTS "Salesmen can insert leads" ON leads;
   CREATE POLICY "Salesmen can insert leads" ON leads FOR INSERT WITH CHECK (
       EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'salesman')
   );
   ```

3. **Check Database Tables:**
   - Go to Supabase Dashboard > Table Editor
   - Ensure `leads` table exists
   - Run the complete migration from SETUP.md

4. **Test Database Connection:**
   ```bash
   npm run test:connection
   ```

### 2. **Test Data Not Present**

**Problem:** No test data appears in the app.

**Solutions:**

1. **Run Complete Migration:**
   - Copy the entire SQL from SETUP.md
   - Run it in Supabase SQL Editor
   - This will create all tables and insert test data

2. **Verify Data Insertion:**
   ```sql
   -- Check if data exists
   SELECT COUNT(*) FROM app_users;
   SELECT COUNT(*) FROM leads;
   SELECT COUNT(*) FROM support_tickets;
   SELECT COUNT(*) FROM customers;
   ```

3. **Re-run Migration if Needed:**
   ```sql
   -- Clear existing data and re-insert
   TRUNCATE TABLE leads, support_tickets, customers, notifications;
   -- Then run the INSERT statements from SETUP.md
   ```

### 3. **Functions Not Working**

**Problem:** Various app functions (activate, edit, delete) don't work.

**Solutions:**

1. **Check Edge Functions:**
   - Go to Supabase Dashboard > Edge Functions
   - Ensure `loginUser` and `createUser` are deployed
   - Check Edge Function logs for errors

2. **Set Environment Variables:**
   - Go to Supabase Dashboard > Settings > Edge Functions
   - Add these environment variables:
     - `SUPABASE_URL`: Your project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

3. **Check RLS Policies:**
   ```sql
   -- Ensure all policies exist
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

4. **Test Edge Functions:**
   ```bash
   # Test login function
   curl -X POST https://your-project.supabase.co/functions/v1/loginUser \
     -H "Content-Type: application/json" \
     -d '{"email":"john@roshni.com","password":"password123"}'
   ```

### 4. **Android Device Connection Issues**

**Problem:** Cannot connect Android device to the development server.

**Solutions:**

#### Method 1: Expo Go (Recommended)
```bash
# Start development server
npm run dev

# If QR code doesn't work, try tunnel mode
npx expo start --tunnel

# Or try localhost mode
npx expo start --localhost
```

#### Method 2: Manual IP Connection
1. **Find your computer's IP:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **In Expo Go app:**
   - Tap "Enter URL manually"
   - Enter: `exp://YOUR_IP:8081`
   - Example: `exp://192.168.1.100:8081`

#### Method 3: USB Debugging
1. **Enable Developer Options** on Android device
2. **Enable USB Debugging**
3. **Connect via USB**
4. **Run:**
   ```bash
   npx expo start --localhost
   ```

#### Method 4: Network Troubleshooting
```bash
# Check if port 8081 is open
netstat -an | grep 8081

# Try different ports
npx expo start --port 19000

# Check firewall settings
# Allow Node.js and Expo in Windows Firewall
```

### 5. **White Screen on Android**

**Problem:** App shows white screen after loading.

**Solutions:**

1. **Clear Expo Go Cache:**
   - Open Expo Go app
   - Go to Settings > Clear Cache
   - Restart the app

2. **Check Metro Bundler:**
   - Look for JavaScript errors in terminal
   - Check for red error screens

3. **Restart Development Server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Clear Metro cache
   npx expo start --clear
   ```

4. **Check Environment Variables:**
   ```bash
   # Verify .env file exists and has correct values
   cat .env
   ```

### 6. **Login Issues**

**Problem:** Cannot log in with demo accounts.

**Solutions:**

1. **Check Demo Users:**
   ```sql
   -- Verify demo users exist
   SELECT email, role, is_active FROM app_users;
   ```

2. **Reset Demo Passwords:**
   ```sql
   -- Reset all demo passwords to "password123"
   UPDATE app_users 
   SET password_hash = '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2'
   WHERE email IN (
     'john@roshni.com',
     'sarah@roshni.com', 
     'mike@roshni.com',
     'admin@roshni.com',
     'raj@roshni.com',
     'priya@roshni.com',
     'amit@roshni.com'
   );
   ```

3. **Check Edge Function:**
   - Ensure `loginUser` function is deployed
   - Check function logs for errors

### 7. **Database Connection Errors**

**Problem:** "Edge Function returned a non-2xx status code"

**Solutions:**

1. **Check Environment Variables in Supabase:**
   - Go to Settings > Edge Functions
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

2. **Test Database Connection:**
   ```bash
   npm run test:connection
   ```

3. **Check Supabase Project Status:**
   - Go to Supabase Dashboard
   - Check if project is active
   - Verify API keys are correct

4. **Check RLS Policies:**
   ```sql
   -- Disable RLS temporarily for testing
   ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
   ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
   -- Test functionality, then re-enable with proper policies
   ```

## 🔧 Quick Fix Commands

### Reset Everything
```bash
# 1. Clear all data and re-setup
# Run the complete SQL migration from SETUP.md

# 2. Restart development server
npm run dev

# 3. Test connection
npm run test:connection

# 4. Try different connection methods
npx expo start --tunnel
```

### Test Specific Components
```bash
# Test database connection
npm run test:connection

# Test Edge Functions
curl -X POST https://your-project.supabase.co/functions/v1/testConnection

# Test login
curl -X POST https://your-project.supabase.co/functions/v1/loginUser \
  -H "Content-Type: application/json" \
  -d '{"email":"john@roshni.com","password":"password123"}'
```

## 📱 Android Connection Checklist

- [ ] Phone and computer on same WiFi network
- [ ] Expo Go app installed on Android device
- [ ] Development server running (`npm run dev`)
- [ ] QR code visible in terminal
- [ ] Firewall allows Expo/Node.js
- [ ] Try tunnel mode if QR doesn't work
- [ ] Try manual IP connection
- [ ] Try USB debugging as last resort

## 🗄️ Database Checklist

- [ ] All tables created (app_users, leads, support_tickets, customers, notifications)
- [ ] RLS policies configured
- [ ] Demo users inserted with correct passwords
- [ ] Test data inserted
- [ ] Edge Functions deployed
- [ ] Environment variables set in Supabase
- [ ] Connection test passes (`npm run test:connection`)

## 🚀 Final Verification

After applying all fixes:

1. **Test Database:**
   ```bash
   npm run test:connection
   ```

2. **Test Login:**
   - Use demo account: `john@roshni.com` / `password123`
   - Should redirect to salesman dashboard

3. **Test Lead Creation:**
   - Go to "New Lead" screen
   - Fill form and submit
   - Should show success message

4. **Test Android Connection:**
   - Start server: `npm run dev`
   - Scan QR with Expo Go
   - App should load without white screen

5. **Test All Functions:**
   - Login/logout works
   - Add/edit/delete leads works
   - Support tickets work
   - User management works (super admin)
   - Notifications work

If any step fails, refer to the specific troubleshooting section above. 