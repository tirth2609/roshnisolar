export interface CallLog {
  id: string;
  created_at: string;
  user_id: string;
  lead_id?: string;
  customer_id?: string;
  caller_name?: string; // This would be joined from the users table
  status_at_call?: string;
  notes?: string;
} 