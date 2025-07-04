-- =====================================================
-- MANUAL SUPABASE SETUP FOR CALL OPERATOR FEATURES
-- =====================================================
-- Run these commands in your Supabase SQL Editor
-- =====================================================

-- 1. Add Additional Phone Number Column to Leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS additional_phone TEXT;

-- 2. Create Call Later Logs Table
CREATE TABLE IF NOT EXISTS call_later_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    call_operator_id UUID NOT NULL REFERENCES app_users(id),
    call_operator_name TEXT NOT NULL,
    call_later_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add Call Later Tracking Columns to Leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS call_later_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_call_later_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_call_later_reason TEXT;

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_call_later_logs_lead_id ON call_later_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_later_logs_operator_id ON call_later_logs(call_operator_id);
CREATE INDEX IF NOT EXISTS idx_call_later_logs_date ON call_later_logs(call_later_date);
CREATE INDEX IF NOT EXISTS idx_leads_additional_phone ON leads(additional_phone);
CREATE INDEX IF NOT EXISTS idx_leads_phone_search ON leads USING gin(to_tsvector('english', phone_number || ' ' || COALESCE(additional_phone, '')));

-- 5. Enable RLS on Call Later Logs
ALTER TABLE call_later_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for Call Later Logs
-- Policy for call operators to view their own call later logs
CREATE POLICY "Call operators can view their call later logs" ON call_later_logs
    FOR SELECT USING (
        call_operator_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
        )
    );

-- Policy for call operators to insert their own call later logs
CREATE POLICY "Call operators can insert call later logs" ON call_later_logs
    FOR INSERT WITH CHECK (
        call_operator_id = auth.uid()
    );

-- Policy for super admins and team leads to manage all call later logs
CREATE POLICY "Super admins and team leads can manage all call later logs" ON call_later_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('super_admin', 'team_lead')
        )
    );

-- 7. Create Cancelled Leads View
CREATE OR REPLACE VIEW cancelled_leads AS
SELECT 
    l.*,
    u.name as cancelled_by_name,
    u.role as cancelled_by_role
FROM leads l
LEFT JOIN app_users u ON l.call_operator_id = u.id
WHERE l.status = 'declined'
ORDER BY l.updated_at DESC;

-- 8. Grant Access to Cancelled Leads View
GRANT SELECT ON cancelled_leads TO authenticated;

-- Note: Views inherit RLS from the underlying table (leads), so no separate RLS policy needed for cancelled_leads view

-- 9. Create Trigger Function for Call Later Count
CREATE OR REPLACE FUNCTION update_lead_call_later_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads 
    SET 
        call_later_count = (
            SELECT COUNT(*) 
            FROM call_later_logs 
            WHERE lead_id = NEW.lead_id
        ),
        last_call_later_date = NEW.call_later_date,
        last_call_later_reason = NEW.reason,
        updated_at = NOW()
    WHERE id = NEW.lead_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create Trigger
CREATE TRIGGER update_lead_call_later_count_trigger
    AFTER INSERT ON call_later_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_call_later_count();

-- 11. Update existing leads to have call_later_count = 0 if NULL
UPDATE leads SET call_later_count = 0 WHERE call_later_count IS NULL;

-- 12. Create function to search leads by phone number
CREATE OR REPLACE FUNCTION search_leads_by_phone(search_phone TEXT)
RETURNS TABLE (
    id UUID,
    customer_name TEXT,
    phone_number TEXT,
    additional_phone TEXT,
    email TEXT,
    address TEXT,
    property_type TEXT,
    likelihood TEXT,
    status TEXT,
    salesman_id UUID,
    salesman_name TEXT,
    call_operator_id UUID,
    call_operator_name TEXT,
    technician_id UUID,
    technician_name TEXT,
    call_notes TEXT,
    visit_notes TEXT,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    rescheduled_date TIMESTAMP WITH TIME ZONE,
    rescheduled_by TEXT,
    reschedule_reason TEXT,
    scheduled_call_date TIMESTAMP WITH TIME ZONE,
    scheduled_call_time TEXT,
    scheduled_call_reason TEXT,
    customer_id UUID,
    call_later_count INTEGER,
    last_call_later_date TIMESTAMP WITH TIME ZONE,
    last_call_later_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.customer_name,
        l.phone_number,
        l.additional_phone,
        l.email,
        l.address,
        l.property_type,
        l.likelihood,
        l.status,
        l.salesman_id,
        l.salesman_name,
        l.call_operator_id,
        l.call_operator_name,
        l.technician_id,
        l.technician_name,
        l.call_notes,
        l.visit_notes,
        l.follow_up_date,
        l.rescheduled_date,
        l.rescheduled_by,
        l.reschedule_reason,
        l.scheduled_call_date,
        l.scheduled_call_time,
        l.scheduled_call_reason,
        l.customer_id,
        l.call_later_count,
        l.last_call_later_date,
        l.last_call_later_reason,
        l.created_at,
        l.updated_at
    FROM leads l
    WHERE 
        l.phone_number ILIKE '%' || search_phone || '%'
        OR l.additional_phone ILIKE '%' || search_phone || '%'
    ORDER BY l.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 13. Grant execute permission on search function
GRANT EXECUTE ON FUNCTION search_leads_by_phone(TEXT) TO authenticated;

-- 14. Create RLS policy for search function (on the leads table)
CREATE POLICY "Users can search leads by phone" ON leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role IN ('call_operator', 'super_admin', 'team_lead')
        )
    );

-- =====================================================
-- VERIFICATION QUERIES (Optional - run to check setup)
-- =====================================================

-- Check if additional_phone column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'additional_phone';

-- Check if call_later_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'call_later_logs';

-- Check if cancelled_leads view exists
SELECT table_name 
FROM information_schema.views 
WHERE table_name = 'cancelled_leads';

-- Check if indexes exist
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('leads', 'call_later_logs') 
AND indexname LIKE 'idx_%';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'update_lead_call_later_count_trigger';

-- =====================================================
-- SAMPLE DATA INSERTION (Optional - for testing)
-- =====================================================

-- Insert a sample call later log (replace with actual UUIDs)
-- INSERT INTO call_later_logs (lead_id, call_operator_id, call_operator_name, call_later_date, reason, notes)
-- VALUES (
--     'your-lead-uuid-here',
--     'your-operator-uuid-here', 
--     'John Doe',
--     NOW() + INTERVAL '1 day',
--     'Customer requested to call back tomorrow',
--     'Customer was busy at work'
-- );

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- All necessary tables, views, indexes, policies, and triggers
-- have been created for the call operator features.
-- 
-- Features now available:
-- 1. Additional phone number field in leads
-- 2. Call later functionality with logging
-- 3. Call later history tracking
-- 4. Phone number search functionality
-- 5. Cancelled leads view for admins/team leads
-- 6. Proper RLS policies for security
-- 7. Performance indexes for better query speed
-- ===================================================== 