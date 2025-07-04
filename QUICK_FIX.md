# 🚨 Quick Fix Guide - Roshni Solar App

## Current Issues Identified:
1. ✅ **Demo users added** - All 7 demo users are now in the database
2. ❌ **Missing tables** - `customers` and `notifications` tables don't exist
3. ❌ **No test data** - `leads` and `support_tickets` tables are empty
4. ❌ **RLS policies blocking** - Cannot insert data due to strict policies
5. ❌ **Android connection** - Need to troubleshoot device connection

## 🔧 Manual Fix Required

### Step 1: Run Complete Database Setup

**Go to Supabase Dashboard > SQL Editor and run this complete SQL:**

```sql
-- Complete database setup and test data
-- Run this in Supabase SQL Editor

-- Create missing tables
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('residential', 'commercial', 'industrial')),
    lead_id UUID REFERENCES leads(id),
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('reschedule', 'lead_assigned', 'lead_completed', 'general')),
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix RLS policies (allow all operations for testing)
DROP POLICY IF EXISTS "Users can view leads" ON leads;
DROP POLICY IF EXISTS "Salesmen can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can update their assigned leads" ON leads;

DROP POLICY IF EXISTS "Users can view support_tickets" ON support_tickets;
DROP POLICY IF EXISTS "Call operators can insert tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their assigned tickets" ON support_tickets;

-- Create permissive policies for testing
CREATE POLICY "Users can view leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Salesmen can insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their assigned leads" ON leads FOR UPDATE USING (true);

CREATE POLICY "Users can view support_tickets" ON support_tickets FOR SELECT USING (true);
CREATE POLICY "Call operators can insert tickets" ON support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their assigned tickets" ON support_tickets FOR UPDATE USING (true);

-- Insert test leads
INSERT INTO leads (id, customer_name, phone_number, email, address, property_type, likelihood, status, salesman_id, salesman_name, call_operator_id, call_operator_name, technician_id, technician_name, call_notes, visit_notes, created_at, updated_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Ramesh Gupta', '+91-9123456789', 'ramesh@email.com', '123 MG Road, Bangalore, Karnataka 560001', 'residential', 'hot', 'new', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Sunita Devi', '+91-9123456790', 'sunita@email.com', '456 Brigade Road, Bangalore, Karnataka 560025', 'residential', 'warm', 'new', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Tech Solutions Pvt Ltd', '+91-9123456791', 'contact@techsolutions.com', '789 Electronic City, Bangalore, Karnataka 560100', 'commercial', 'hot', 'new', '550e8400-e29b-41d4-a716-446655440005', 'Raj Patel', NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
  ('650e8400-e29b-41d4-a716-446655440004', 'Vikram Singh', '+91-9123456792', 'vikram@email.com', '321 Koramangala, Bangalore, Karnataka 560034', 'residential', 'warm', 'contacted', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', NULL, NULL, 'Customer is interested. Wants to know about government subsidies.', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours'),
  ('650e8400-e29b-41d4-a716-446655440005', 'Green Industries', '+91-9123456793', 'info@greenindustries.com', '654 Whitefield, Bangalore, Karnataka 560066', 'industrial', 'hot', 'contacted', '550e8400-e29b-41d4-a716-446655440005', 'Raj Patel', '550e8400-e29b-41d4-a716-446655440006', 'Priya Sharma', NULL, NULL, 'Very interested in large-scale installation.', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert test support tickets
INSERT INTO support_tickets (id, customer_id, customer_name, customer_phone, title, description, priority, status, operator_id, operator_name, technician_id, technician_name, notes, created_at, updated_at, resolved_at) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', 'CUST001', 'Ravi Krishnan', '+91-9123456796', 'Solar panel not generating expected output', 'Customer reports that solar panels installed last month are generating 30% less power than expected.', 'high', 'open', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NULL),
  ('750e8400-e29b-41d4-a716-446655440002', 'CUST002', 'Anita Reddy', '+91-9123456794', 'Inverter display showing error code', 'Inverter display is showing error code E03. Customer manual says to contact support.', 'urgent', 'open', '550e8400-e29b-41d4-a716-446655440006', 'Priya Sharma', NULL, NULL, NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NULL),
  ('750e8400-e29b-41d4-a716-446655440003', 'CUST003', 'Smart Homes Pvt Ltd', '+91-9123456795', 'Request for system expansion', 'Client wants to add 2 more panels to existing commercial installation.', 'medium', 'in_progress', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', '550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'Technician assigned. Site visit scheduled for tomorrow.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (id, customer_name, phone_number, email, address, property_type, lead_id, converted_at, status, notes, created_at, updated_at)
VALUES 
  ('850e8400-e29b-41d4-a716-446655440001', 'Ravi Krishnan', '+91-9123456796', 'ravi@email.com', '258 Indiranagar, Bangalore, Karnataka 560038', 'residential', NULL, NOW() - INTERVAL '2 days', 'active', 'Converted from lead. 5kW system installed successfully.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('850e8400-e29b-41d4-a716-446655440002', 'John Smith', '+91-9876543210', 'john@example.com', '123 Main St, Mumbai, MH', 'residential', NULL, NOW() - INTERVAL '1 week', 'active', 'Sample customer', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week')
ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (id, user_id, title, message, type, data, is_read, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  au.id,
  'Welcome to Roshni Solar',
  'Welcome to the Roshni Solar app! You can now start managing your leads and customers.',
  'general',
  '{}'::jsonb,
  false,
  NOW(),
  NOW()
FROM app_users au
WHERE au.role = 'call_operator'
ON CONFLICT DO NOTHING;
```

### Step 2: Deploy Edge Functions

**Go to Supabase Dashboard > Edge Functions and create:**

1. **loginUser** function (copy from `supabase/functions/loginUser/index.ts`)
2. **createUser** function (copy from `supabase/functions/createUser/index.ts`)

### Step 3: Set Environment Variables

**Go to Supabase Dashboard > Settings > Edge Functions and add:**
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### Step 4: Test Database

```bash
npm run test:connection
```

### Step 5: Start Development Server

```bash
npm run dev
```

### Step 6: Connect Android Device

**Method 1: Expo Go (Recommended)**
1. Install Expo Go on Android device
2. Make sure phone and computer are on same WiFi
3. Scan QR code from terminal
4. If QR doesn't work, try: `npx expo start --tunnel`

**Method 2: Manual IP**
1. Find your computer's IP: `ipconfig` (Windows)
2. In Expo Go: "Enter URL manually"
3. Enter: `exp://YOUR_IP:8081`

**Method 3: USB Debugging**
1. Enable Developer Options on Android
2. Enable USB Debugging
3. Connect via USB
4. Run: `npx expo start --localhost`

## 🧪 Test Everything

### Demo Accounts (Password: "password123")
- **Salesman**: `john@roshni.com`
- **Call Operator**: `sarah@roshni.com`
- **Technician**: `mike@roshni.com`
- **Super Admin**: `admin@roshni.com`

### Test Checklist
- [ ] Login works with demo accounts
- [ ] Can add new leads (salesman)
- [ ] Can view and manage leads
- [ ] Can create support tickets (call operator)
- [ ] Can manage users (super admin)
- [ ] Android device connects and app loads
- [ ] All buttons and functions work

## 🚨 If Still Having Issues

1. **Check Supabase Dashboard** - Ensure project is active
2. **Check Edge Function Logs** - Look for errors
3. **Try Different Connection Methods** - Tunnel, localhost, USB
4. **Clear Expo Go Cache** - Settings > Clear Cache
5. **Restart Development Server** - `npx expo start --clear`

## 📞 Support

If issues persist:
1. Check the `TROUBLESHOOTING.md` file for detailed solutions
2. Run `npm run test:connection` to diagnose database issues
3. Check Supabase Dashboard for any error messages
4. Verify all environment variables are set correctly

The app should now be fully functional with all test data and working features! 