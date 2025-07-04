// types/support.ts
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  customer_id: string;      // Changed from customerId to customer_id
  customer_name: string;    // Changed from customerName to customer_name
  customer_phone: string;   // Changed from customerPhone to customer_phone
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  operator_id: string;      // Changed from operatorId to operator_id
  operator_name: string;    // Changed from operatorName to operator_name
  technician_id?: string;   // Changed from technicianId to technician_id
  technician_name?: string; // Changed from technicianName to technician_name
  notes?: string;
  created_at: string;       // Changed from createdAt to created_at
  updated_at: string;       // Changed from updatedAt to updated_at
  resolved_at?: string;     // Changed from resolvedAt to resolved_at
}

export interface NewTicketData {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  title: string;
  description: string;
  priority: TicketPriority;
}