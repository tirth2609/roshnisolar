// types/customers.ts
export type ProjectStatus = 
  | 'Awaiting 1st Payment'
  | 'Material Distribution'
  | 'Awaiting 2nd Payment'
  | 'Work in Progress'
  | 'Meter Installation'
  | 'Completed';

export interface Customer {
  id: string;
  customer_id: string; // Unique ID like RE001, CO001, IN001
  customer_name: string;
  phone_number: string;
  email?: string;
  address: string;
  property_type: 'residential' | 'commercial' | 'water_heater';
  lead_id: string; // Reference to the original lead
  converted_at: string; // When the lead was converted to customer
  status: 'active' | 'inactive';
  project_status?: ProjectStatus; // New field for the project pipeline
  notes?: string;
  
  // New fields for customer details
  electricity_bill_number?: string;
  average_electricity_usage?: number; // in kWh
  electricity_usage_unit?: string; // kWh, units, etc.
  
  // Payment information
  has_paid_first_installment?: boolean;
  payment_method?: 'cash' | 'loan' | null;
  cash_bill_number?: string;
  
  // Loan details
  loan_provider?: string;
  loan_amount?: number;
  loan_account_number?: string;
  loan_status?: 'pending' | 'approved' | 'disbursed' | 'rejected';
  loan_notes?: string;
  
  // Additional customer needs
  customer_needs?: string;
  preferred_installation_date?: string;
  special_requirements?: string;
  
  created_at: string;
  updated_at: string;
}

export interface NewCustomerData {
  customer_name: string;
  phone_number: string;
  email?: string;
  address: string;
  property_type: 'residential' | 'commercial' | 'water_heater';
  lead_id: string;
  notes?: string;
  
  // New fields
  electricity_bill_number?: string;
  average_electricity_usage?: number;
  electricity_usage_unit?: string;
  has_paid_first_installment?: boolean;
  payment_method?: 'cash' | 'loan' | null;
  cash_bill_number?: string;
  loan_provider?: string;
  loan_amount?: number;
  loan_account_number?: string;
  loan_status?: 'pending' | 'approved' | 'disbursed' | 'rejected';
  loan_notes?: string;
  customer_needs?: string;
  preferred_installation_date?: string;
  special_requirements?: string;
}

export interface CustomerConversionData {
  lead_id: string;
  customer_name: string;
  email: string;
  electricity_bill_number: string;
  average_electricity_usage: number;
  electricity_usage_unit: string;
  has_paid_first_installment: boolean;
  payment_method?: 'cash' | 'loan';
  cash_bill_number?: string;
  loan_provider?: string;
  loan_amount?: number;
  loan_account_number?: string;
  loan_status?: 'pending' | 'approved' | 'disbursed' | 'rejected';
  loan_notes?: string;
  customer_needs: string;
  preferred_installation_date?: string;
  special_requirements?: string;
  notes?: string;
} 