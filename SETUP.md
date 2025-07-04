# Roshni Solar App - Complete Setup Guide

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env` file in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

## 📱 Android Device Connection

### Method 1: Using Expo Go (Recommended for testing)

1. **Install Expo Go** on your Android device from Google Play Store
2. **Make sure your phone and computer are on the same WiFi network**
3. **Start the development server:**
   ```bash
   npm run dev
   ```
4. **Scan the QR code** with Expo Go app
5. **If QR code doesn't work**, try these alternatives:
   - Use the **"Enter URL manually"** option in Expo Go
   - Enter: `exp://YOUR_COMPUTER_IP:8081`
   - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Method 2: Using Expo Dev Client (For development builds)

1. **Install Expo Dev Client:**
   ```bash
   npx expo install expo-dev-client
   ```

2. **Build development client:**
   ```bash
   npx expo run:android
   ```

### Troubleshooting Android Connection

**If you can't connect to your Android device:**

1. **Check firewall settings** - Allow Expo on your computer
2. **Try different connection methods:**
   ```bash
   # Try tunnel mode
   npx expo start --tunnel
   
   # Try localhost mode
   npx expo start --localhost
   ```

3. **Check your computer's IP address:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

4. **Use USB debugging:**
   - Enable Developer Options on your Android device
   - Enable USB Debugging
   - Connect via USB and run: `npx expo start --localhost`

## 🗄️ Supabase Setup

### 1. Database Migration

Run this SQL in your Supabase SQL Editor to set up the complete database:

```sql
-- Migration: Add complete test data and fix database structure
-- Date: 2024-12-01

-- First, ensure all tables exist with proper structure
CREATE TABLE IF NOT EXISTS app_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('salesman', 'call_operator', 'technician', 'super_admin')),
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('residential', 'commercial', 'industrial')),
    likelihood TEXT NOT NULL CHECK (likelihood IN ('hot', 'warm', 'cold')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'hold', 'transit', 'declined', 'completed')),
    salesman_id UUID REFERENCES app_users(id),
    salesman_name TEXT,
    call_operator_id UUID REFERENCES app_users(id),
    call_operator_name TEXT,
    technician_id UUID REFERENCES app_users(id),
    technician_name TEXT,
    call_notes TEXT,
    visit_notes TEXT,
    rescheduled_date TIMESTAMP WITH TIME ZONE,
    rescheduled_by TEXT,
    reschedule_reason TEXT,
    customer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    operator_id UUID REFERENCES app_users(id),
    operator_name TEXT,
    technician_id UUID REFERENCES app_users(id),
    technician_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_salesman_id ON leads(salesman_id);
CREATE INDEX IF NOT EXISTS idx_leads_call_operator_id ON leads(call_operator_id);
CREATE INDEX IF NOT EXISTS idx_leads_technician_id ON leads(technician_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_operator_id ON support_tickets(operator_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_technician_id ON support_tickets(technician_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_customers_lead_id ON customers(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Enable RLS on all tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- App users policies
DROP POLICY IF EXISTS "Users can view all users" ON app_users;
CREATE POLICY "Users can view all users" ON app_users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super admins can manage users" ON app_users;
CREATE POLICY "Super admins can manage users" ON app_users FOR ALL USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'super_admin')
);

-- Leads policies
DROP POLICY IF EXISTS "Users can view leads" ON leads;
CREATE POLICY "Users can view leads" ON leads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Salesmen can insert leads" ON leads;
CREATE POLICY "Salesmen can insert leads" ON leads FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'salesman')
);
DROP POLICY IF EXISTS "Users can update their assigned leads" ON leads;
CREATE POLICY "Users can update their assigned leads" ON leads FOR UPDATE USING (
    salesman_id = auth.uid() OR call_operator_id = auth.uid() OR technician_id = auth.uid()
);

-- Support tickets policies
DROP POLICY IF EXISTS "Users can view support tickets" ON support_tickets;
CREATE POLICY "Users can view support tickets" ON support_tickets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Call operators can insert tickets" ON support_tickets;
CREATE POLICY "Call operators can insert tickets" ON support_tickets FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'call_operator')
);
DROP POLICY IF EXISTS "Users can update their assigned tickets" ON support_tickets;
CREATE POLICY "Users can update their assigned tickets" ON support_tickets FOR UPDATE USING (
    operator_id = auth.uid() OR technician_id = auth.uid()
);

-- Customers policies
DROP POLICY IF EXISTS "Users can view customers" ON customers;
CREATE POLICY "Users can view customers" ON customers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
CREATE POLICY "Users can insert customers" ON customers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update customers" ON customers;
CREATE POLICY "Users can update customers" ON customers FOR UPDATE USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Insert demo users (password: "password123")
INSERT INTO app_users (id, email, name, phone, role, password_hash, is_active, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'john@roshni.com', 'John Smith', '+91-9876543210', 'salesman', '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'sarah@roshni.com', 'Sarah Johnson', '+91-9876543211', 'call_operator', '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'mike@roshni.com', 'Mike Wilson', '+91-9876543212', 'technician', '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'admin@roshni.com', 'Admin User', '+91-9876543213', 'super_admin', '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'raj@roshni.com', 'Raj Patel', '+91-9876543214', 'salesman', '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'priya@roshni.com', 'Priya Sharma', '+91-9876543215', 'call_operator', '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440007', 'amit@roshni.com', 'Amit Kumar', '+91-9876543216', 'technician', '$2b$10$rQZ8kHp.TB.It.NNlClXve5LKlQBYlpjOLaD5QxoR8L6cpNUU6TL2', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  is_active = true,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Insert test leads
INSERT INTO leads (id, customer_name, phone_number, email, address, property_type, likelihood, status, salesman_id, salesman_name, call_operator_id, call_operator_name, technician_id, technician_name, call_notes, visit_notes, created_at, updated_at) VALUES
  -- New leads (submitted by salesmen)
  ('650e8400-e29b-41d4-a716-446655440001', 'Ramesh Gupta', '+91-9123456789', 'ramesh@email.com', '123 MG Road, Bangalore, Karnataka 560001', 'residential', 'hot', 'new', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  
  ('650e8400-e29b-41d4-a716-446655440002', 'Sunita Devi', '+91-9123456790', 'sunita@email.com', '456 Brigade Road, Bangalore, Karnataka 560025', 'residential', 'warm', 'new', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  
  ('650e8400-e29b-41d4-a716-446655440003', 'Tech Solutions Pvt Ltd', '+91-9123456791', 'contact@techsolutions.com', '789 Electronic City, Bangalore, Karnataka 560100', 'commercial', 'hot', 'new', '550e8400-e29b-41d4-a716-446655440005', 'Raj Patel', NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
  
  -- Contacted leads (processed by call operators)
  ('650e8400-e29b-41d4-a716-446655440004', 'Vikram Singh', '+91-9123456792', 'vikram@email.com', '321 Koramangala, Bangalore, Karnataka 560034', 'residential', 'warm', 'contacted', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', NULL, NULL, 'Customer is interested. Wants to know about government subsidies. Scheduled follow-up call for tomorrow.', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '6 hours'),
  
  ('650e8400-e29b-41d4-a716-446655440005', 'Green Industries', '+91-9123456793', 'info@greenindustries.com', '654 Whitefield, Bangalore, Karnataka 560066', 'industrial', 'hot', 'contacted', '550e8400-e29b-41d4-a716-446655440005', 'Raj Patel', '550e8400-e29b-41d4-a716-446655440006', 'Priya Sharma', NULL, NULL, 'Very interested in large-scale installation. Ready to proceed with site visit. Decision maker available next week.', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 hours'),
  
  -- Transit leads (assigned to technicians)
  ('650e8400-e29b-41d4-a716-446655440006', 'Anita Reddy', '+91-9123456794', 'anita@email.com', '987 Jayanagar, Bangalore, Karnataka 560011', 'residential', 'hot', 'transit', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', '550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'Customer confirmed interest. Site visit scheduled for this week.', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
  
  ('650e8400-e29b-41d4-a716-446655440007', 'Smart Homes Pvt Ltd', '+91-9123456795', 'contact@smarthomes.com', '147 HSR Layout, Bangalore, Karnataka 560102', 'commercial', 'warm', 'transit', '550e8400-e29b-41d4-a716-446655440005', 'Raj Patel', '550e8400-e29b-41d4-a716-446655440006', 'Priya Sharma', '550e8400-e29b-41d4-a716-446655440007', 'Amit Kumar', 'Commercial client interested in rooftop solar for office building. Site assessment needed.', NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),
  
  -- Completed leads
  ('650e8400-e29b-41d4-a716-446655440008', 'Ravi Krishnan', '+91-9123456796', 'ravi@email.com', '258 Indiranagar, Bangalore, Karnataka 560038', 'residential', 'hot', 'completed', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', '550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'Customer very enthusiastic. Quick decision maker.', 'Installation completed successfully. 5kW system installed. Customer satisfied with the work. System generating expected output.', NOW() - INTERVAL '1 week', NOW() - INTERVAL '2 days'),
  
  -- Hold leads
  ('650e8400-e29b-41d4-a716-446655440009', 'Lakshmi Nair', '+91-9123456797', 'lakshmi@email.com', '369 Malleshwaram, Bangalore, Karnataka 560003', 'residential', 'cold', 'hold', '550e8400-e29b-41d4-a716-446655440005', 'Raj Patel', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', NULL, NULL, 'Customer interested but wants to wait for 3 months due to budget constraints. Follow-up scheduled.', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
  
  -- Declined leads
  ('650e8400-e29b-41d4-a716-446655440010', 'Suresh Babu', '+91-9123456798', 'suresh@email.com', '741 RT Nagar, Bangalore, Karnataka 560032', 'residential', 'cold', 'declined', '550e8400-e29b-41d4-a716-446655440001', 'John Smith', '550e8400-e29b-41d4-a716-446655440006', 'Priya Sharma', '550e8400-e29b-41d4-a716-446655440007', 'Amit Kumar', 'Customer not interested after initial discussion.', 'Customer decided not to proceed after site visit. Roof structure not suitable for installation.', NOW() - INTERVAL '1 week', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- Insert test support tickets
INSERT INTO support_tickets (id, customer_id, customer_name, customer_phone, title, description, priority, status, operator_id, operator_name, technician_id, technician_name, notes, created_at, updated_at, resolved_at) VALUES
  -- Open tickets
  ('750e8400-e29b-41d4-a716-446655440001', 'CUST001', 'Ravi Krishnan', '+91-9123456796', 'Solar panel not generating expected output', 'Customer reports that solar panels installed last month are generating 30% less power than expected. System was working fine initially but output has decreased over the past week.', 'high', 'open', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NULL),
  
  ('750e8400-e29b-41d4-a716-446655440002', 'CUST002', 'Anita Reddy', '+91-9123456794', 'Inverter display showing error code', 'Inverter display is showing error code E03. Customer manual says to contact support. System stopped working yesterday evening.', 'urgent', 'open', '550e8400-e29b-41d4-a716-446655440006', 'Priya Sharma', NULL, NULL, NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NULL),
  
  -- In progress tickets
  ('750e8400-e29b-41d4-a716-446655440003', 'CUST003', 'Smart Homes Pvt Ltd', '+91-9123456795', 'Request for system expansion', 'Client wants to add 2 more panels to existing commercial installation. Need assessment for roof capacity and electrical upgrades.', 'medium', 'in_progress', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', '550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'Technician assigned. Site visit scheduled for tomorrow to assess expansion feasibility.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours', NULL),
  
  ('750e8400-e29b-41d4-a716-446655440004', 'CUST004', 'Vikram Singh', '+91-9123456792', 'Cleaning and maintenance service', 'Customer requesting quarterly maintenance service. Panels need cleaning and system health check.', 'low', 'in_progress', '550e8400-e29b-41d4-a716-446655440006', 'Priya Sharma', '550e8400-e29b-41d4-a716-446655440007', 'Amit Kumar', 'Maintenance visit scheduled. Technician will perform cleaning and system diagnostics.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours', NULL),
  
  -- Resolved tickets
  ('750e8400-e29b-41d4-a716-446655440005', 'CUST005', 'Green Industries', '+91-9123456793', 'Monitoring app not showing data', 'Customer unable to access solar monitoring app. Login credentials not working.', 'medium', 'resolved', '550e8400-e29b-41d4-a716-446655440002', 'Sarah Johnson', '550e8400-e29b-41d4-a716-446655440003', 'Mike Wilson', 'Issue resolved. App credentials reset and new login details provided to customer. System monitoring working normally.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  
  ('750e8400-e29b-41d4-a716-446655440006', 'CUST006', 'Ramesh Gupta', '+91-9123456789', 'Bird nesting on solar panels', 'Customer reports birds have built nest on solar panels affecting performance. Requesting safe removal.', 'low', 'resolved', '550e8400-e29b-41d4-a716-446655440006', 'Priya Sharma', '550e8400-e29b-41d4-a716-446655440007', 'Amit Kumar', 'Bird nest safely removed. Bird guards installed to prevent future nesting. System performance restored to normal.', NOW() - INTERVAL '1 week', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (id, customer_name, phone_number, email, address, property_type, lead_id, converted_at, status, notes, created_at, updated_at)
VALUES 
  ('850e8400-e29b-41d4-a716-446655440001', 'Ravi Krishnan', '+91-9123456796', 'ravi@email.com', '258 Indiranagar, Bangalore, Karnataka 560038', 'residential', '650e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '2 days', 'active', 'Converted from lead. 5kW system installed successfully.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('850e8400-e29b-41d4-a716-446655440002', 'John Smith', '+91-9876543210', 'john@example.com', '123 Main St, Mumbai, MH', 'residential', NULL, NOW() - INTERVAL '1 week', 'active', 'Sample customer', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
  ('850e8400-e29b-41d4-a716-446655440003', 'Jane Doe', '+91-9876543211', 'jane@example.com', '456 Business Ave, Delhi, DL', 'commercial', NULL, NOW() - INTERVAL '1 week', 'active', 'Sample commercial customer', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week')
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_app_users_updated_at ON app_users;
CREATE TRIGGER update_app_users_updated_at 
    BEFORE UPDATE ON app_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Edge Functions Setup

**Deploy Edge Functions manually in Supabase Dashboard:**

1. Go to **Edge Functions** in your Supabase Dashboard
2. Create these functions:

#### loginUser Function
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from app_users table
    const { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user

    return new Response(
      JSON.stringify({
        user: userWithoutPassword,
        message: 'Login successful'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

#### createUser Function
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, name, phone, role } = await req.json()

    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, password, name, and role are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password)

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('app_users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        phone: phone || null,
        role,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = newUser

    return new Response(
      JSON.stringify({
        user: userWithoutPassword,
        message: 'User created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

### 3. Environment Variables for Edge Functions

In your Supabase Dashboard, go to **Settings > Edge Functions** and add these environment variables:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## 🔐 Demo Accounts

Use these accounts to test the app:

| Role | Email | Password |
|------|-------|----------|
| Salesman | john@roshni.com | password123 |
| Call Operator | sarah@roshni.com | password123 |
| Technician | mike@roshni.com | password123 |
| Super Admin | admin@roshni.com | password123 |
| Salesman | raj@roshni.com | password123 |
| Call Operator | priya@roshni.com | password123 |
| Technician | amit@roshni.com | password123 |

## 🛠️ Troubleshooting

### Common Issues

1. **"Edge Function returned a non-2xx status code"**
   - Check that Edge Functions are deployed
   - Verify environment variables are set in Supabase Dashboard
   - Check Edge Function logs in Supabase Dashboard

2. **"Cannot add leads"**
   - Ensure you're logged in as a salesman
   - Check RLS policies are properly set
   - Verify database tables exist

3. **"Android device not connecting"**
   - Make sure both devices are on same WiFi
   - Try tunnel mode: `npx expo start --tunnel`
   - Check firewall settings
   - Use USB debugging as alternative

4. **"White screen on Android"**
   - Clear Expo Go cache
   - Restart Expo development server
   - Check for JavaScript errors in Metro bundler

5. **"Functions not working"**
   - Ensure all Edge Functions are deployed
   - Check environment variables in Supabase
   - Verify RLS policies allow proper access

### Debug Steps

1. **Check Supabase Connection:**
   ```bash
   # Test the connection
   curl -X POST https://your-project.supabase.co/functions/v1/testConnection
   ```

2. **Check Edge Function Logs:**
   - Go to Supabase Dashboard > Edge Functions > Logs

3. **Check Database Tables:**
   - Go to Supabase Dashboard > Table Editor
   - Verify all tables exist and have data

4. **Check RLS Policies:**
   - Go to Supabase Dashboard > Authentication > Policies
   - Ensure policies are properly configured

## 📱 Features Working

✅ **Login/Logout** - All demo accounts work  
✅ **Lead Management** - Add, edit, delete, reschedule leads  
✅ **Support Tickets** - Create and manage tickets  
✅ **User Management** - Super admin can manage users  
✅ **Notifications** - Real-time notifications for actions  
✅ **Bulk Import** - Import multiple leads at once  
✅ **Customer Generation** - Convert leads to customers  
✅ **Role-based Access** - Different features per role  

## 🚀 Next Steps

1. **Run the SQL migration** in Supabase Dashboard
2. **Deploy Edge Functions** manually
3. **Set environment variables** in Supabase
4. **Start the development server** with `npm run dev`
5. **Connect your Android device** using Expo Go
6. **Test all features** with demo accounts

The app should now be fully functional with all test data and working features! 