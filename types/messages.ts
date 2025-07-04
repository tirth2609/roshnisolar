export interface PredefinedMessage {
  id: string;
  title: string;
  message: string;
  category: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateMessageData {
  title: string;
  message: string;
  category: string;
}

export interface UpdateMessageData {
  title?: string;
  message?: string;
  category?: string;
  is_active?: boolean;
}

export type MessageCategory = 
  | 'initial_contact'
  | 'follow_up'
  | 'appointment'
  | 'quote'
  | 'installation'
  | 'support'
  | 'referral'
  | 'promotion'
  | 'general';

export const MESSAGE_CATEGORIES: { value: MessageCategory; label: string }[] = [
  { value: 'initial_contact', label: 'Initial Contact' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'quote', label: 'Quote' },
  { value: 'installation', label: 'Installation' },
  { value: 'support', label: 'Customer Support' },
  { value: 'referral', label: 'Referral' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'general', label: 'General' },
]; 