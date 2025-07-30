// types/leads.ts
export type LeadStatus = 'new' | 'ringing' | 'contacted' | 'hold' | 'transit' | 'declined' | 'completed';
export type LeadLikelihood = 'hot' | 'warm' | 'cold';
export type PropertyType = 'residential' | 'commercial' | 'industrial';

export interface Lead {
  id: string;
  customer_name: string;
  phone_number: string;
  additional_phone?: string;
  email?: string;
  address: string;
  property_type: PropertyType;
  likelihood: LeadLikelihood;
  status: LeadStatus;
  salesman_id?: string; 
  salesman_name?: string;
  call_operator_id?: string;
  call_operator_name?: string;
  technician_id?: string;
  technician_name?: string;
  call_notes?: string;
  visit_notes?: string;
  follow_up_date?: string;
  rescheduled_date?: string;
  rescheduled_by?: string;
  reschedule_reason?: string;
  scheduled_call_date?: string;
  scheduledCallTime?: string;
  scheduled_call_reason?: string;
  customer_id?: string;
  call_later_count?: number;
  last_call_later_date?: string;
  last_call_later_reason?: string;
  created_at: string;
  updated_at: string;
  team_lead_id?: string;
  team_lead_name?: string;
  super_admin_id?: string;
  super_admin_name?: string;
  created_by?: string;
  created_by_name?: string;
}

export interface NewLeadData {
  customer_name: string;
  phone_number: string;
  additional_phone?: string;
  email?: string;
  address: string;
  property_type: PropertyType;
  likelihood: LeadLikelihood;
  status?: LeadStatus;
  salesman_id?: string;
  salesman_name?: string;
  call_operator_id?: string;
  call_operator_name?: string;
  technician_id?: string;
  technician_name?: string;
  call_notes?: string;
  visit_notes?: string;
  follow_up_date?: string;
  team_lead_id?: string;
  team_lead_name?: string;
  super_admin_id?: string;
  super_admin_name?: string;
  customer_id?: string;
  created_by?: string;
  created_by_name?: string;
}

export interface RescheduleData {
  leadId: string;
  newDate: string;
  reason: string;
  rescheduledBy: string;
}

export interface ScheduleCallData {
  leadId: string;
  callDate: string;
  callTime: string;
  reason: string;
  scheduledBy: string;
}

// New interfaces for call operator features
export interface CallLaterLog {
  id: string;
  lead_id: string;
  call_operator_id: string;
  call_operator_name: string;
  call_later_date: string;
  reason: string;
  notes?: string;
  createdAt: string;
}

export interface CallLaterData {
  lead_id: string;
  call_later_date: string;
  reason: string;
  notes?: string;
}

export interface LeadStatusUpdateData {
  leadId: string;
  newStatus: LeadStatus;
  notes?: string;
  call_later_date?: string;
  call_later_reason?: string;
  call_later_time?: string;
}