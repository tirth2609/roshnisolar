-- =====================================================
-- CUSTOMER TABLE UPDATE FOR TEAM LEAD FEATURES
-- =====================================================
-- Run these commands in your Supabase SQL Editor
-- =====================================================

-- 1. Add new columns to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_id TEXT UNIQUE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS electricity_bill_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS average_electricity_usage NUMERIC;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS electricity_usage_unit TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS has_paid_first_installment BOOLEAN DEFAULT FALSE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'loan'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS cash_bill_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loan_provider TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loan_amount NUMERIC;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loan_account_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loan_status TEXT CHECK (loan_status IN ('pending', 'approved', 'disbursed', 'rejected'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loan_notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_needs TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_installation_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS special_requirements TEXT;

-- 2. Create index for customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);

-- 3. Create index for property_type for customer ID generation
CREATE INDEX IF NOT EXISTS idx_customers_property_type ON customers(property_type);

-- 4. Update existing customers to have a customer_id if they don't have one
-- Using a CTE to avoid window function in UPDATE
WITH numbered_customers AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM customers 
  WHERE customer_id IS NULL
)
UPDATE customers 
SET customer_id = 'CU' || LPAD(c.row_num::TEXT, 3, '0')
FROM numbered_customers c
WHERE customers.id = c.id;

-- 5. Create a function to generate customer IDs
CREATE OR REPLACE FUNCTION generate_customer_id(property_type TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    next_number INTEGER;
    new_id TEXT;
BEGIN
    -- Set prefix based on property type
    CASE LOWER(property_type)
        WHEN 'residential' THEN prefix := 'RE';
        WHEN 'commercial' THEN prefix := 'CO';
        WHEN 'industrial' THEN prefix := 'IN';
        ELSE prefix := 'CU';
    END CASE;
    
    -- Get the next number for this prefix
    SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
    INTO next_number
    FROM customers
    WHERE customer_id LIKE prefix || '%';
    
    -- Format the ID
    new_id := prefix || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION generate_customer_id(TEXT) TO authenticated;

-- 7. Create a trigger to automatically generate customer_id for new customers
CREATE OR REPLACE FUNCTION auto_generate_customer_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NULL THEN
        NEW.customer_id := generate_customer_id(NEW.property_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_customer_id ON customers;
CREATE TRIGGER trigger_auto_generate_customer_id
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_customer_id();

-- 9. Update RLS policies to include new fields
-- (This assumes you already have RLS enabled on customers table)

-- 10. Create a view for team leads to see transit leads ready for conversion
CREATE OR REPLACE VIEW transit_leads_for_conversion AS
SELECT 
    l.*,
    u.name as team_lead_name,
    u.role as team_lead_role
FROM leads l
LEFT JOIN app_users u ON l.technician_id = u.id
WHERE l.status = 'transit'
ORDER BY l.updated_at DESC;

-- 11. Grant access to the view
GRANT SELECT ON transit_leads_for_conversion TO authenticated;

-- 12. Create a view for completed customers with payment details
CREATE OR REPLACE VIEW customer_payment_summary AS
SELECT 
    c.customer_id,
    c.customer_name,
    c.property_type,
    c.has_paid_first_installment,
    c.payment_method,
    c.loan_status,
    c.loan_amount,
    c.converted_at,
    l.salesman_name,
    l.call_operator_name
FROM customers c
LEFT JOIN leads l ON c.lead_id = l.id
WHERE c.status = 'active'
ORDER BY c.converted_at DESC;

-- 13. Grant access to the payment summary view
GRANT SELECT ON customer_payment_summary TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if all new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name IN (
    'customer_id', 'electricity_bill_number', 'average_electricity_usage',
    'electricity_usage_unit', 'has_paid_first_installment', 'payment_method',
    'cash_bill_number', 'loan_provider', 'loan_amount', 'loan_account_number',
    'loan_status', 'loan_notes', 'customer_needs', 'preferred_installation_date',
    'special_requirements'
);

-- Check if function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'generate_customer_id';

-- Check if trigger exists
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_generate_customer_id';

-- Test the customer ID generation function
SELECT generate_customer_id('residential') as residential_id,
       generate_customer_id('commercial') as commercial_id,
       generate_customer_id('industrial') as industrial_id;

-- Check existing customers with their IDs
SELECT customer_id, customer_name, property_type 
FROM customers 
ORDER BY created_at 
LIMIT 10;

-- =====================================================
-- SAMPLE DATA INSERTION (Optional - for testing)
-- =====================================================

-- Insert a sample customer with all new fields
-- INSERT INTO customers (
--     customer_name, phone_number, email, address, property_type, 
--     lead_id, converted_at, status, notes,
--     electricity_bill_number, average_electricity_usage, electricity_usage_unit,
--     has_paid_first_installment, payment_method, cash_bill_number,
--     loan_provider, loan_amount, loan_account_number, loan_status, loan_notes,
--     customer_needs, preferred_installation_date, special_requirements
-- ) VALUES (
--     'John Doe', '+1234567890', 'john@example.com', '123 Main St', 'residential',
--     'your-lead-uuid-here', NOW(), 'active', 'Sample customer',
--     'EB123456789', 500, 'kWh',
--     true, 'cash', 'CB987654321',
--     NULL, NULL, NULL, NULL, NULL,
--     'Solar panel installation for home', '2024-02-15', 'Installation during weekdays only'
-- );

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- The customers table has been updated with all necessary fields
-- for the team lead dashboard features.
-- 
-- New features available:
-- 1. Unique customer IDs (RE001, CO001, IN001)
-- 2. Electricity bill details
-- 3. Payment information (cash/loan)
-- 4. Loan details and status
-- 5. Customer needs and requirements
-- 6. Automatic customer ID generation
-- 7. Views for team lead dashboard
-- ===================================================== 