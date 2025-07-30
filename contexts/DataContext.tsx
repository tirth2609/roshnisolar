// contexts/DataContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { Lead, NewLeadData, LeadStatus, RescheduleData, ScheduleCallData, CallLaterLog, CallLaterData, LeadStatusUpdateData } from '@/types/leads';
import { SupportTicket, NewTicketData, TicketStatus } from '@/types/support';
import { Customer, NewCustomerData, CustomerConversionData, ProjectStatus } from '@/types/customers';
import { CallLog } from '@/types/logs';
import { PredefinedMessage, CreateMessageData, UpdateMessageData } from '@/types/messages';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { NotificationService } from '../lib/notifications';

// Define the structure for your app_users from the database
interface AppUserFromDB {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DataContextType {
  leads: Lead[];
  supportTickets: SupportTicket[];
  customers: Customer[];
  callLaterLogs: CallLaterLog[];
  callLogs: CallLog[];
  predefinedMessages: PredefinedMessage[];
  addLead: (leadData: NewLeadData) => Promise<void>;
  updateLeadStatus: (leadId: string, status: LeadStatus, notes?: string) => Promise<void>;
  updateLeadStatusWithCallLater: (data: LeadStatusUpdateData) => Promise<void>;
  assignLeadToTechnician: (leadId: string, technicianId: string) => Promise<void>;
  assignLeadToCallOperator: (leadId: string, callOperatorId: string) => Promise<void>;
  reassignLead: (leadId: string, newUserId: string, newUserRole: string) => Promise<void>;
  reassignLeadFromOperator: (leadId: string, fromOperatorId: string, toOperatorId: string) => Promise<void>;
  bulkAssignLeadsToCallOperator: (leadIds: string[], callOperatorId: string) => Promise<void>;
  bulkAssignLeadsToTechnician: (leadIds: string[], technicianId: string) => Promise<void>;
  scheduleCall: (scheduleData: ScheduleCallData) => Promise<void>;
  getUnassignedLeads: () => Promise<Lead[]>;
  getUnassignedToCallOperators: () => Promise<Lead[]>;
  getUnassignedToTechnicians: () => Promise<Lead[]>;
  getLeadsByUser: (userId: string, userRole: string) => Promise<Lead[]>;
  getScheduledCallsForToday: (userId: string) => Promise<Lead[]>;
  rescheduleLead: (rescheduleData: RescheduleData) => Promise<void>;
  convertLeadToCustomer: (leadId: string, notes?: string) => Promise<void>;
  convertLeadToCustomerWithDetails: (data: CustomerConversionData) => Promise<void>;
  addSupportTicket: (ticketData: NewTicketData) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus, notes?: string) => Promise<void>;
  assignTicketToTechnician: (ticketId: string, technicianId: string) => Promise<void>;
  addCustomer: (customerData: NewCustomerData) => Promise<void>;
  updateCustomer: (customerId: string, customerData: Partial<Customer>) => Promise<void>;
  getUserLeads: (userId: string) => Lead[];
  getUserTickets: (userId: string) => SupportTicket[];
  getAllUsers: () => AppUserFromDB[];
  getTechnicians: () => AppUserFromDB[];
  getCallOperators: () => AppUserFromDB[];
  getTeamLeads: () => AppUserFromDB[];
  getSalesmen: () => AppUserFromDB[];
  getLeadsBySalesman: (salesmanId: string) => Lead[];
  getUserWorkStats: (userId: string) => Promise<any>;
  addUser: (userData: any) => Promise<void>;
  updateUser: (userId: string, userData: any) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  bulkImportLeads: (leadsData: NewLeadData[]) => Promise<void>;
  getAnalytics: () => Promise<any>;
  addCallLaterLog: (data: CallLaterData) => Promise<void>;
  getCallLaterLogs: (leadId: string) => CallLaterLog[];
  getCallLaterLogsByOperator: (operatorId: string) => CallLaterLog[];
  searchLeadsByPhone: (phoneNumber: string) => Lead[];
  getCancelledLeads: () => Promise<Lead[]>;
  bulkReassignCancelledLeads: (leadIds: string[], callOperatorId: string) => Promise<void>;
  getTransitLeads: () => Promise<Lead[]>;
  generateCustomerId: (propertyType: string) => Promise<string>;
  updateCustomerProjectStatus: (customerId: string, status: ProjectStatus) => Promise<void>;
  logCall: (logData: { leadId?: string; customerId?: string; status?: LeadStatus, notes?: string }) => Promise<void>;
  getCallLogs: (leadId?: string, customerId?: string) => CallLog[];
  // Predefined Messages functions
  addPredefinedMessage: (messageData: CreateMessageData) => Promise<void>;
  updatePredefinedMessage: (messageId: string, messageData: UpdateMessageData) => Promise<void>;
  deletePredefinedMessage: (messageId: string) => Promise<void>;
  getPredefinedMessages: () => PredefinedMessage[];
  getPredefinedMessagesByCategory: (category: string) => PredefinedMessage[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  // New pagination state and functions
  fetchLeads: (page?: number, pageSize?: number) => Promise<void>;
  leadPage: number;
  totalLeadsCount: number;
  setLeadPage: (page: number) => void;
  leadPageSize: number;
  setLeadPageSize: React.Dispatch<React.SetStateAction<number>>;
  updateLeadStatusWithLog: (leadId: string, status: LeadStatus, notes?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [appUsers, setAppUsers] = useState<AppUserFromDB[]>([]);
  const [callLaterLogs, setCallLaterLogs] = useState<CallLaterLog[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [predefinedMessages, setPredefinedMessages] = useState<PredefinedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Pagination state for leads
  const [leadPage, setLeadPage] = useState(1);
  const [leadPageSize, setLeadPageSize] = useState(20);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);

  // Function to fetch leads with pagination and joins
  const fetchLeads = useCallback(async (page = leadPage, pageSize = leadPageSize) => {
    try {
      console.log(`🔍 Fetching leads (Page ${page}, Size ${pageSize})`);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('leads')
        .select(`
          *,
          salesman:app_users!salesman_id(name),
          call_operator:app_users!call_operator_id(name),
          technician:app_users!technician_id(name),
          team_lead:app_users!team_lead_id(name),
          super_admin:app_users!super_admin_id(name),
          created_by:app_users!created_by(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Map the joined data to match the Lead interface
      const mappedLeads: Lead[] = (data || []).map((lead: any) => ({
        ...lead,
        salesman_name: lead.salesman?.name || null,
        call_operator_name: lead.call_operator?.name || null,
        technician_name: lead.technician?.name || null,
        team_lead_name: lead.team_lead?.name || null,
        super_admin_name: lead.super_admin?.name || null,
        created_by_name: lead.created_by?.name || null, // FIX: Fetching created_by_name
      }));

      setLeads(mappedLeads);
      setTotalLeadsCount(count || 0);
      console.log('✅ Leads fetched successfully:', mappedLeads.length, 'leads on this page. Total count:', count);
    } catch (error: any) {
      console.error('❌ Error fetching leads:', error.message);
      Alert.alert('Error', 'Failed to fetch leads. Please check your connection.');
    }
  }, [leadPage, leadPageSize]);

  // Function to fetch customers from Supabase
  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mappedCustomers = (data || []).map((customer: any) => ({
        ...customer,
        customerId: customer.customer_id,
        customerName: customer.customer_name,
        phoneNumber: customer.phone_number,
        propertyType: customer.property_type,
        leadId: customer.lead_id,
        convertedAt: customer.converted_at,
        electricityBillNumber: customer.electricity_bill_number,
        averageElectricityUsage: customer.average_electricity_usage,
        electricityUsageUnit: customer.electricity_usage_unit,
        hasPaidFirstInstallment: customer.has_paid_first_installment,
        paymentMethod: customer.payment_method,
        cashBillNumber: customer.cash_bill_number,
        loanProvider: customer.loan_provider,
        loanAmount: customer.loan_amount,
        loanAccountNumber: customer.loan_account_number,
        loanStatus: customer.loan_status,
        loanNotes: customer.loan_notes,
        customerNeeds: customer.customer_needs,
        preferredInstallationDate: customer.preferred_installation_date,
        specialRequirements: customer.special_requirements,
        project_status: customer.project_status,
      }));

      setCustomers(mappedCustomers || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error.message);
      Alert.alert('Error', 'Failed to fetch customers. Please check your connection.');
    }
  }, []);

  // Function to fetch users from your custom 'app_users' table
  const fetchAppUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mappedUsers = (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        is_active: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));

      setAppUsers(mappedUsers || []);
    } catch (error: any) {
      console.error('Error fetching app users:', error.message);
      Alert.alert('Error', 'Failed to fetch users. Please check your connection.');
    }
  }, []);

  // Function to fetch support tickets
  const fetchSupportTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setSupportTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching support tickets:', error.message);
      Alert.alert('Error', 'Failed to fetch support tickets. Please check your connection.');
    }
  }, []);

  // Function to fetch call later logs
  const fetchCallLaterLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('call_later_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mappedLogs: CallLaterLog[] = (data || []).map((log: any) => ({
        id: log.id,
        lead_id: log.lead_id,
        call_operator_id: log.call_operator_id,
        call_operator_name: log.call_operator_name,
        call_later_date: log.call_later_date,
        reason: log.reason,
        notes: log.notes,
        createdAt: log.created_at,
      }));
      setCallLaterLogs(mappedLogs);
    } catch (error: any) {
      console.error('Error fetching call later logs:', error.message);
    }
  }, []);

  const fetchCallLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*, caller:app_users!caller_id(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mappedLogs: CallLog[] = (data || []).map((log: any) => ({
        id: log.id,
        created_at: log.created_at,
        user_id: log.user_id,
        lead_id: log.lead_id,
        customer_id: log.customer_id,
        caller_name: log.caller?.name || log.user_id || 'Unknown',
        status_at_call: log.status_at_call,
        notes: log.notes,
      }));
      setCallLogs(mappedLogs);
    } catch (error: any) {
      console.error('Error fetching call logs:', error.message);
    }
  }, []);

  // Function to fetch predefined messages from Supabase
  const fetchPredefinedMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('predefined_messages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPredefinedMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching predefined messages:', error.message);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      await Promise.all([
        fetchLeads(1, leadPageSize), // Always refresh to the first page
        fetchAppUsers(), 
        fetchSupportTickets(), 
        fetchCustomers(),
        fetchCallLaterLogs(),
        fetchCallLogs(),
        fetchPredefinedMessages(),
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh data. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchLeads, fetchAppUsers, fetchSupportTickets, fetchCustomers, fetchCallLaterLogs, fetchCallLogs, fetchPredefinedMessages, leadPageSize]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setLeads([]);
      setSupportTickets([]);
      setCustomers([]);
      setAppUsers([]);
      setCallLaterLogs([]);
      setCallLogs([]);
      setPredefinedMessages([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshData]);

  const addLead = async (leadData: NewLeadData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const { data, error } = await supabase.from('leads').insert({
        customer_name: leadData.customer_name,
        phone_number: leadData.phone_number,
        additional_phone: leadData.additional_phone,
        address: leadData.address,
        property_type: leadData.property_type,
        likelihood: leadData.likelihood,
        status: 'new',
        salesman_id: user.id,
        salesman_name: user.name,
        created_by: user.id, // Store created_by
      }).select();
      
      if (error) throw error;
      refreshData();
    } catch (error: any) {
      console.error('Error adding lead:', error.message);
      Alert.alert('Error', `Failed to add lead: ${error.message}`);
    }
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus, notes?: string): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      if (notes && status === 'contacted') {
        updateData.call_notes = notes;
        updateData.call_operator_id = user.id;
        updateData.call_operator_name = user.name;
      }
      if (notes && (status === 'transit' || status === 'completed')) {
        updateData.visit_notes = notes;
      }
      const { error } = await supabase.from('leads').update(updateData).eq('id', leadId);
      if (error) throw error;
      fetchLeads();
    } catch (error: any) {
      console.error('Error updating lead status:', error.message);
      Alert.alert('Error', `Failed to update lead status: ${error.message}`);
    }
  };

  const rescheduleLead = async (rescheduleData: RescheduleData): Promise<void> => {
    try {
      const { error } = await supabase.from('leads').update({
        rescheduled_date: rescheduleData.newDate,
        rescheduled_by: rescheduleData.rescheduledBy,
        reschedule_reason: rescheduleData.reason,
        status: 'hold',
        updated_at: new Date().toISOString()
      }).eq('id', rescheduleData.leadId);
      
      if (error) throw error;
      
      const lead = leads.find(l => l.id === rescheduleData.leadId);
      if (lead) {
        await NotificationService.createRescheduleNotification(
          rescheduleData.rescheduledBy,
          rescheduleData.leadId,
          lead.customer_name,
          rescheduleData.newDate,
          rescheduleData.reason
        );
        NotificationService.showLocalNotification(
          'Lead Rescheduled',
          `Lead for ${lead.customer_name} has been rescheduled to ${new Date(rescheduleData.newDate).toLocaleDateString()}`
        );
      }
      
      fetchLeads();
    } catch (error: any) {
      console.error('Error rescheduling lead:', error.message);
      Alert.alert('Error', `Failed to reschedule lead: ${error.message}`);
    }
  };

  const convertLeadToCustomer = async (leadId: string, notes?: string): Promise<void> => {
    try {
      const lead = leads.find(l => l.id === leadId);
      if (!lead) {
        Alert.alert('Error', 'Lead not found.');
        return;
      }
      const customerData: NewCustomerData = {
        customer_name: lead.customer_name,
        phone_number: lead.phone_number,
        email: lead.email,
        address: lead.address,
        property_type: lead.property_type,
        lead_id: leadId,
        notes: notes || `Converted from lead on ${new Date().toLocaleDateString()}`
      };
      const { data: customer, error: customerError } = await supabase.from('customers').insert({
        customer_name: customerData.customer_name,
        phone_number: customerData.phone_number,
        email: customerData.email,
        address: customerData.address,
        property_type: customerData.property_type,
        leadId: customerData.lead_id,
        converted_at: new Date().toISOString(),
        status: 'active',
        notes: customerData.notes
      }).select();
      if (customerError) throw customerError;
      const { error: leadError } = await supabase.from('leads').update({
        customer_id: customer[0].id,
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', leadId);
      if (leadError) throw leadError;
      if (lead.salesman_id) {
        await NotificationService.createLeadCompletionNotification(
          lead.salesman_id,
          leadId,
          lead.customer_name
        );
      }
      NotificationService.showLocalNotification(
        'Lead Converted',
        `Lead for ${lead.customer_name} has been successfully converted to customer.`
      );
      await Promise.all([fetchLeads(), fetchCustomers()]);
    } catch (error: any) {
      console.error('Error converting lead to customer:', error.message);
      Alert.alert('Error', `Failed to convert lead: ${error.message}`);
    }
  };

  const assignLeadToTechnician = async (leadId: string, technicianId: string): Promise<void> => {
    const technician = appUsers.find(u => u.id === technicianId);
    if (!technician) {
      Alert.alert('Error', 'Technician not found.');
      return;
    }
    try {
      const { error } = await supabase.from('leads').update({
        technician_id: technicianId,
        technician_name: technician.name,
        status: 'transit',
        updated_at: new Date().toISOString()
      }).eq('id', leadId);
      
      if (error) throw error;
      fetchLeads();
    } catch (error: any) {
      console.error('Error assigning technician to lead:', error.message);
      Alert.alert('Error', `Failed to assign technician: ${error.message}`);
    }
  };

  const assignLeadToCallOperator = async (leadId: string, callOperatorId: string): Promise<void> => {
    const callOperator = appUsers.find(u => u.id === callOperatorId);
    if (!callOperator) {
      Alert.alert('Error', 'Call operator not found.');
      return;
    }
    try {
      const { error } = await supabase.from('leads').update({
        call_operator_id: callOperatorId,
        call_operator_name: callOperator.name,
        status: 'new',
        updated_at: new Date().toISOString()
      }).eq('id', leadId);
      
      if (error) throw error;
      await NotificationService.createLeadAssignmentNotification(
        callOperatorId,
        leadId,
        'New Lead Assigned'
      );
      fetchLeads();
    } catch (error: any) {
      console.error('Error assigning call operator to lead:', error.message);
      Alert.alert('Error', `Failed to assign call operator: ${error.message}`);
    }
  };

  const reassignLead = async (leadId: string, newUserId: string, newUserRole: string): Promise<void> => {
    const newUser = appUsers.find(u => u.id === newUserId);
    if (!newUser) {
      Alert.alert('Error', 'User not found.');
      return;
    }
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        salesman_id: null,
        salesman_name: null,
        call_operator_id: null,
        call_operator_name: null,
        technician_id: null,
        technician_name: null,
      };
      switch (newUserRole) {
        case 'salesman':
          updateData.salesman_id = newUserId;
          updateData.salesman_name = newUser.name;
          updateData.status = 'new';
          break;
        case 'call_operator':
          updateData.call_operator_id = newUserId;
          updateData.call_operator_name = newUser.name;
          updateData.status = 'new';
          break;
        case 'technician':
          updateData.technician_id = newUserId;
          updateData.technician_name = newUser.name;
          updateData.status = 'transit';
          break;
        default:
          throw new Error('Invalid user role for lead assignment');
      }
      const { error } = await supabase.from('leads').update(updateData).eq('id', leadId);
      
      if (error) throw error;
      await NotificationService.createLeadAssignmentNotification(
        newUserId,
        leadId,
        'Lead Reassigned'
      );
      fetchLeads();
    } catch (error: any) {
      console.error('Error reassigning lead:', error.message);
      Alert.alert('Error', `Failed to reassign lead: ${error.message}`);
    }
  };
  
  // Refactored to query database directly for efficiency
  const getUnassignedLeads = useCallback(async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*').is('call_operator_id', null).is('technician_id', null);
    if (error) {
      console.error('Error fetching unassigned leads:', error);
      return [];
    }
    return data || [];
  }, []);

  const getUnassignedToCallOperators = useCallback(async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*').is('call_operator_id', null);
    if (error) {
      console.error('Error fetching unassigned leads for operators:', error);
      return [];
    }
    return data || [];
  }, []);

  const getUnassignedToTechnicians = useCallback(async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*').is('technician_id', null);
    if (error) {
      console.error('Error fetching unassigned leads for technicians:', error);
      return [];
    }
    return data || [];
  }, []);

  const getLeadsByUser = useCallback(async (userId: string, userRole: string): Promise<Lead[]> => {
    let query = supabase.from('leads').select('*');
    switch (userRole) {
      case 'salesman':
        query = query.eq('salesman_id', userId);
        break;
      case 'call_operator':
        query = query.eq('call_operator_id', userId);
        break;
      case 'technician':
        query = query.eq('technician_id', userId);
        break;
      default:
        return [];
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching leads by user:', error);
      return [];
    }
    return data || [];
  }, []);

  const getScheduledCallsForToday = useCallback(async (userId: string): Promise<Lead[]> => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase.from('leads').select('*')
      .eq('call_operator_id', userId)
      .eq('scheduled_call_date', today);
    if (error) {
      console.error('Error fetching scheduled calls:', error);
      return [];
    }
    return data || [];
  }, []);

  const scheduleCall = async (scheduleData: ScheduleCallData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const { error } = await supabase.from('leads').update({
        scheduled_call_date: scheduleData.callDate,
        scheduledCallTime: scheduleData.callTime,
        scheduled_call_reason: scheduleData.reason,
        status: 'hold',
        updated_at: new Date().toISOString()
      }).eq('id', scheduleData.leadId);
      if (error) throw error;
      await NotificationService.createNotification({
        userId: user.id,
        title: 'Call Scheduled',
        message: `Call scheduled for ${scheduleData.callDate} at ${scheduleData.callTime}`,
        type: 'general',
        data: { leadId: scheduleData.leadId },
        isRead: false,
      });
      fetchLeads();
    } catch (error: any) {
      console.error('Error scheduling call:', error.message);
      Alert.alert('Error', `Failed to schedule call: ${error.message}`);
    }
  };

  const addCustomer = async (customerData: NewCustomerData): Promise<void> => {
    try {
      const { data, error } = await supabase.from('customers').insert({
        customer_name: customerData.customer_name,
        phone_number: customerData.phone_number,
        email: customerData.email,
        address: customerData.address,
        property_type: customerData.property_type,
        leadId: customerData.lead_id,
        converted_at: new Date().toISOString(),
        status: 'active',
        notes: customerData.notes
      }).select();
      if (error) throw error;
      fetchCustomers();
    } catch (error: any) {
      console.error('Error adding customer:', error.message);
      Alert.alert('Error', `Failed to add customer: ${error.message}`);
    }
  };

  const updateCustomer = async (customerId: string, customerData: Partial<Customer>): Promise<void> => {
    try {
      const { error } = await supabase.from('customers').update({
        ...customerData,
        updated_at: new Date().toISOString()
      }).eq('id', customerId);
      if (error) throw error;
      fetchCustomers();
    } catch (error: any) {
      console.error('Error updating customer:', error.message);
      Alert.alert('Error', `Failed to update customer: ${error.message}`);
    }
  };

  const bulkImportLeads = async (leadsData: NewLeadData[]): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const leadsToInsert = leadsData.map(lead => ({
        customer_name: lead.customer_name,
        phone_number: lead.phone_number,
        additional_phone: lead.additional_phone,
        address: lead.address,
        property_type: lead.property_type,
        likelihood: lead.likelihood,
        status: 'new',
        salesman_id: user.id,
        salesman_name: user.name,
        created_by: user.id,
      }));
      const { error } = await supabase.from('leads').insert(leadsToInsert);
      if (error) throw error;
      fetchLeads();
      Alert.alert('Success', `Successfully imported ${leadsData.length} leads.`);
    } catch (error: any) {
      console.error('Error importing leads:', error.message);
      Alert.alert('Error', `Failed to import leads: ${error.message}`);
    }
  };

  const addSupportTicket = async (ticketData: NewTicketData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const { data, error } = await supabase.from('support_tickets').insert({
        customer_name: ticketData.customer_name,
        customer_phone: ticketData.customer_phone,
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        status: 'open',
        operator_id: user.id,
        operator_name: user.name,
      }).select();
      if (error) throw error;
      fetchSupportTickets();
    } catch (error: any) {
      console.error('Error adding support ticket:', error.message);
      Alert.alert('Error', `Failed to add support ticket: ${error.message}`);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus, notes?: string): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      if (notes) {
        updateData.notes = notes;
      }
      const { error } = await supabase.from('support_tickets').update(updateData).eq('id', ticketId);
      if (error) throw error;
      fetchSupportTickets();
    } catch (error: any) {
      console.error('Error updating ticket status:', error.message);
      Alert.alert('Error', `Failed to update ticket status: ${error.message}`);
    }
  };

  const assignTicketToTechnician = async (ticketId: string, technicianId: string): Promise<void> => {
    const technician = appUsers.find(u => u.id === technicianId);
    if (!technician) {
      Alert.alert('Error', 'Technician not found.');
      return;
    }
    try {
      const { error } = await supabase.from('support_tickets').update({
        technician_id: technicianId,
        technician_name: technician.name,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      }).eq('id', ticketId);
      if (error) throw error;
      fetchSupportTickets();
    } catch (error: any) {
      console.error('Error assigning technician to ticket:', error.message);
      Alert.alert('Error', `Failed to assign technician to ticket: ${error.message}`);
    }
  };

  const getUserLeads = (userId: string): Lead[] => {
    const currentUser = appUsers.find(u => u.id === userId);
    if (!currentUser) return [];
    switch (currentUser.role) {
      case 'salesman':
        return leads.filter(lead => lead.salesman_id === userId);
      case 'call_operator':
        return leads.filter(lead => lead.call_operator_id === userId);
      case 'technician':
        return leads.filter(lead => lead.technician_id === userId);
      case 'super_admin':
      case 'team_lead':
        return leads;
      default:
        return [];
    }
  };

  const getUserTickets = (userId: string): SupportTicket[] => {
    if (!user) return [];
    switch (user.role) {
      case 'call_operator':
        return supportTickets.filter(ticket => ticket.operator_id === userId || !ticket.technician_id);
      case 'technician':
        return supportTickets.filter(ticket => ticket.technician_id === userId);
      case 'super_admin':
        return supportTickets;
      default:
        return [];
    }
  };

  const getAllUsers = () => appUsers;
  const getTechnicians = () => appUsers.filter(u => u.role === 'technician' && u.is_active);
  const getCallOperators = () => appUsers.filter(u => u.role === 'call_operator' && u.is_active);
  const getSalesmen = () => appUsers.filter(u => u.role === 'salesman' && u.is_active);

  const addUser = async (userData: any): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const { data, error } = await supabase.from('app_users').insert({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        password_hash: userData.password,
        is_active: true,
      }).select();
      if (error) throw error;
      fetchAppUsers();
    } catch (error: any) {
      console.error('Error adding user:', error.message);
      Alert.alert('Error', `Failed to add user: ${error.message}`);
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: any): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const { error } = await supabase.from('app_users').update({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        updated_at: new Date().toISOString()
      }).eq('id', userId);
      if (error) throw error;
      fetchAppUsers();
    } catch (error: any) {
      console.error('Error updating user:', error.message);
      Alert.alert('Error', `Failed to update user: ${error.message}`);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      if (userId === user.id) {
        throw new Error('You cannot delete your own account');
      }
      const { error } = await supabase.from('app_users').delete().eq('id', userId);
      if (error) throw error;
      await fetchAppUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error.message);
      Alert.alert('Error', `Failed to delete user: ${error.message}`);
      throw error;
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      if (userId === user.id) {
        throw new Error('You cannot deactivate your own account');
      }
      const { error } = await supabase.from('app_users').update({ 
        is_active: !currentStatus,
        updated_at: new Date().toISOString()
      }).eq('id', userId);
      if (error) throw error;
      await fetchAppUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error.message);
      Alert.alert('Error', `Failed to update user status: ${error.message}`);
      throw error;
    }
  };

  // Refactored to use direct database queries for efficiency
  const getAnalytics = useCallback(async () => {
    const totalLeadsPromise = supabase.from('leads').select('*', { count: 'exact', head: true });
    const completedLeadsPromise = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    const activeTicketsPromise = supabase.from('support_tickets').select('*', { count: 'exact', head: true }).not('status', 'in', ['resolved', 'closed']);
    const totalUsersPromise = supabase.from('app_users').select('*', { count: 'exact', head: true });
    const activeUsersPromise = supabase.from('app_users').select('*', { count: 'exact', head: true }).eq('is_active', true);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    const monthlyLeadsPromise = supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth).lte('created_at', endOfMonth);

    const [
      { count: totalLeads },
      { count: completedLeads },
      { count: activeTickets },
      { count: totalUsers },
      { count: activeUsers },
      { count: monthlyLeads }
    ] = await Promise.all([
      totalLeadsPromise,
      completedLeadsPromise,
      activeTicketsPromise,
      totalUsersPromise,
      activeUsersPromise,
      monthlyLeadsPromise
    ]);

    const conversionRate = totalLeads && totalLeads > 0 ? ((completedLeads || 0) / totalLeads * 100).toFixed(1) : '0';

    return {
      totalLeads,
      completedLeads,
      activeTickets,
      conversionRate,
      totalUsers,
      activeUsers,
      monthlyLeads
    };
  }, []);

  const bulkAssignLeadsToCallOperator = async (leadIds: string[], callOperatorId: string): Promise<void> => {
    const callOperator = appUsers.find(u => u.id === callOperatorId);
    if (!callOperator) {
      Alert.alert('Error', 'Call operator not found.');
      return;
    }
    try {
      const { error } = await supabase.from('leads').update({
        call_operator_id: callOperatorId,
        call_operator_name: callOperator.name,
        status: 'new',
        updated_at: new Date().toISOString()
      }).in('id', leadIds);
      if (error) throw error;
      for (const leadId of leadIds) {
        await NotificationService.createLeadAssignmentNotification(
          callOperatorId,
          leadId,
          'New Lead Assigned'
        );
      }
      fetchLeads();
    } catch (error: any) {
      console.error('Error bulk assigning leads to call operator:', error.message);
      Alert.alert('Error', `Failed to assign leads: ${error.message}`);
    }
  };

  const bulkAssignLeadsToTechnician = async (leadIds: string[], technicianId: string): Promise<void> => {
    const technician = appUsers.find(u => u.id === technicianId);
    if (!technician) {
      Alert.alert('Error', 'Technician not found.');
      return;
    }
    try {
      const { error } = await supabase.from('leads').update({
        technician_id: technicianId,
        technician_name: technician.name,
        status: 'transit',
        updated_at: new Date().toISOString()
      }).in('id', leadIds);
      if (error) throw error;
      for (const leadId of leadIds) {
        await NotificationService.createLeadAssignmentNotification(
          technicianId,
          leadId,
          'New Lead Assigned'
        );
      }
      fetchLeads();
    } catch (error: any) {
      console.error('Error bulk assigning leads to technician:', error.message);
      Alert.alert('Error', `Failed to assign leads: ${error.message}`);
    }
  };

  const getTeamLeads = (): AppUserFromDB[] => {
    return appUsers.filter(user => user.role === 'team_lead' && user.is_active);
  };

  const getLeadsBySalesman = (salesmanId: string): Lead[] => {
    return leads.filter(lead => lead.salesman_id === salesmanId);
  };

  const getTransitLeads = useCallback(async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*').eq('status', 'transit');
    if (error) {
      console.error('Error fetching transit leads:', error);
      return [];
    }
    return data || [];
  }, []);

  // Refactored to use direct database queries for efficiency
  const getUserWorkStats = useCallback(async (userId: string): Promise<any> => {
    const user = appUsers.find(u => u.id === userId);
    if (!user) return {};

    const baseQuery = supabase.from('leads').select('*', { count: 'exact', head: true });

    let totalQuery = baseQuery;
    let createdTodayQuery = baseQuery;
    let createdThisWeekQuery = baseQuery;
    let completedQuery = baseQuery;
    let pendingQuery = baseQuery;
    let lastActivityQuery = supabase.from('leads').select('updated_at').order('updated_at', { ascending: false }).limit(1);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 7).toISOString();

    if (user.role === 'salesman') {
      totalQuery = totalQuery.eq('salesman_id', userId);
      createdTodayQuery = createdTodayQuery.eq('salesman_id', userId).gte('created_at', startOfDay);
      createdThisWeekQuery = createdThisWeekQuery.eq('salesman_id', userId).gte('created_at', startOfWeek).lte('created_at', endOfWeek);
      completedQuery = completedQuery.eq('salesman_id', userId).eq('status', 'completed');
      pendingQuery = pendingQuery.eq('salesman_id', userId).in('status', ['new', 'contacted', 'hold', 'transit']);
      lastActivityQuery = lastActivityQuery.eq('salesman_id', userId);
    } else if (user.role === 'call_operator') {
      totalQuery = totalQuery.eq('call_operator_id', userId);
      createdTodayQuery = createdTodayQuery.eq('call_operator_id', userId).gte('created_at', startOfDay);
      createdThisWeekQuery = createdThisWeekQuery.eq('call_operator_id', userId).gte('created_at', startOfWeek).lte('created_at', endOfWeek);
      completedQuery = completedQuery.eq('call_operator_id', userId).eq('status', 'completed');
      pendingQuery = pendingQuery.eq('call_operator_id', userId).in('status', ['new', 'contacted', 'hold', 'transit']);
      lastActivityQuery = lastActivityQuery.eq('call_operator_id', userId);
    } else if (user.role === 'technician') {
      totalQuery = totalQuery.eq('technician_id', userId);
      createdTodayQuery = createdTodayQuery.eq('technician_id', userId).gte('created_at', startOfDay);
      createdThisWeekQuery = createdThisWeekQuery.eq('technician_id', userId).gte('created_at', startOfWeek).lte('created_at', endOfWeek);
      completedQuery = completedQuery.eq('technician_id', userId).eq('status', 'completed');
      pendingQuery = pendingQuery.eq('technician_id', userId).in('status', ['new', 'contacted', 'hold', 'transit']);
      lastActivityQuery = lastActivityQuery.eq('technician_id', userId);
    } else {
      return {};
    }

    const [
      { count: totalLeads },
      { count: leadsToday },
      { count: leadsThisWeek },
      { count: completedLeads },
      { count: pendingLeads },
      { data: lastActivityData }
    ] = await Promise.all([
      totalQuery,
      createdTodayQuery,
      createdThisWeekQuery,
      completedQuery,
      pendingQuery,
      lastActivityQuery,
    ]);

    const lastActivity = lastActivityData?.[0]?.updated_at ? new Date(lastActivityData[0].updated_at) : null;
    
    return {
      totalLeads,
      leadsToday,
      leadsThisWeek,
      completedLeads,
      pendingLeads,
      lastActivity
    };
  }, [appUsers]);

  const reassignLeadFromOperator = async (leadId: string, fromOperatorId: string, toOperatorId: string): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const toOperator = appUsers.find(u => u.id === toOperatorId);
      if (!toOperator) {
        Alert.alert('Error', 'Target operator not found.');
        return;
      }
      const { error } = await supabase.from('leads').update({
        call_operator_id: toOperatorId,
        call_operator_name: toOperator.name,
        updated_at: new Date().toISOString()
      }).eq('id', leadId);
      if (error) throw error;
      fetchLeads();
    } catch (error: any) {
      console.error('Error reassigning lead:', error.message);
      Alert.alert('Error', `Failed to reassign lead: ${error.message}`);
    }
  };

  const updateLeadStatusWithCallLater = async (data: LeadStatusUpdateData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const updateData: any = {
        status: data.newStatus,
        updated_at: new Date().toISOString()
      };
      if (data.notes && data.newStatus === 'contacted') {
        updateData.call_notes = data.notes;
        updateData.call_operator_id = user.id;
        updateData.call_operator_name = user.name;
      }
      if (data.notes && (data.newStatus === 'transit' || data.newStatus === 'completed')) {
        updateData.visit_notes = data.notes;
      }
      if (data.newStatus === 'hold' && data.call_later_date && data.call_later_reason) {
        await addCallLaterLog({
          lead_id: data.leadId,
          call_later_date: data.call_later_date,
          reason: data.call_later_reason,
          notes: data.notes
        });
        updateData.scheduled_call_date = data.call_later_date;
        updateData.scheduledCallTime = data.call_later_time;
        updateData.scheduled_call_reason = data.call_later_reason;
      }
      const { error } = await supabase.from('leads').update(updateData).eq('id', data.leadId);
      if (error) throw error;
      refreshData();
    } catch (error: any) {
      console.error('Error updating lead status with call later:', error.message);
      Alert.alert('Error', `Failed to update lead status: ${error.message}`);
    }
  };

  const convertLeadToCustomerWithDetails = async (data: CustomerConversionData): Promise<void> => {
    try {
      const lead = leads.find(l => l.id === data.lead_id);
      if (!lead) {
        Alert.alert('Error', 'Lead not found.');
        return;
      }
      const customerId = await generateCustomerId(lead.property_type);
      const customerData = {
        customer_id: customerId,
        customer_name: lead.customer_name,
        phone_number: lead.phone_number,
        email: data.email,
        address: lead.address,
        property_type: lead.property_type,
        lead_id: data.lead_id,
        converted_at: new Date().toISOString(),
        status: 'active',
        notes: data.notes || `Converted from lead on ${new Date().toLocaleDateString()}`,
        electricity_bill_number: data.electricity_bill_number,
        average_electricity_usage: data.average_electricity_usage,
        electricity_usage_unit: data.electricity_usage_unit,
        has_paid_first_installment: data.has_paid_first_installment,
        payment_method: data.payment_method,
        cash_bill_number: data.cash_bill_number,
        loan_provider: data.loan_provider,
        loan_amount: data.loan_amount,
        loan_account_number: data.loan_account_number,
        loan_status: data.loan_status,
        loan_notes: data.loan_notes,
        customer_needs: data.customer_needs,
        preferred_installation_date: data.preferred_installation_date,
        special_requirements: data.special_requirements
      };
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert(customerData)
        .select();
      if (customerError) throw customerError;
      const { error: leadError } = await supabase.from('leads').update({
        customer_id: customer[0].id,
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', data.lead_id);
      if (leadError) throw leadError;
      if (lead.salesman_id) {
        await NotificationService.createLeadCompletionNotification(
          lead.salesman_id,
          data.lead_id,
          lead.customer_name
        );
      }
      NotificationService.showLocalNotification(
        'Lead Converted',
        `Lead for ${lead.customer_name} has been successfully converted to customer with ID: ${customerId}`
      );
      await Promise.all([fetchLeads(), fetchCustomers()]);
    } catch (error: any) {
      console.error('Error converting lead to customer with details:', error.message);
      Alert.alert('Error', `Failed to convert lead: ${error.message}`);
    }
  };

  const addCallLaterLog = async (data: CallLaterData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const { error } = await supabase.from('call_later_logs').insert({
        lead_id: data.lead_id,
        call_operator_id: user.id,
        call_operator_name: user.name,
        call_later_date: data.call_later_date,
        reason: data.reason,
        notes: data.notes
      });
      if (error) throw error;
      await fetchCallLaterLogs();
    } catch (error: any) {
      console.error('Error adding call later log:', error.message);
      Alert.alert('Error', `Failed to add call later log: ${error.message}`);
    }
  };

  const getCallLaterLogs = (leadId: string): CallLaterLog[] => {
    return callLaterLogs.filter((log: CallLaterLog) => log.lead_id === leadId);
  };

  const getCallLaterLogsByOperator = (operatorId: string): CallLaterLog[] => {
    return callLaterLogs.filter((log: CallLaterLog) => log.call_operator_id === operatorId);
  };

  const searchLeadsByPhone = (phoneNumber: string): Lead[] => {
    const searchTerm = phoneNumber.toLowerCase().trim();
    return leads.filter(lead => 
      lead.phone_number.toLowerCase().includes(searchTerm) ||
      (lead.additional_phone && lead.additional_phone.toLowerCase().includes(searchTerm))
    );
  };

  const getCancelledLeads = useCallback(async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*').eq('status', 'declined');
    if (error) {
      console.error('Error fetching cancelled leads:', error);
      return [];
    }
    return data || [];
  }, []);

  const bulkReassignCancelledLeads = async (leadIds: string[], callOperatorId: string): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    const callOperator = appUsers.find(u => u.id === callOperatorId);
    if (!callOperator) {
      Alert.alert('Error', 'Call operator not found.');
      return;
    }
    try {
      const { error } = await supabase.from('leads').update({
        call_operator_id: callOperatorId,
        call_operator_name: callOperator.name,
        status: 'new',
        updated_at: new Date().toISOString()
      }).in('id', leadIds);
      if (error) throw error;
      for (const leadId of leadIds) {
        await NotificationService.createLeadAssignmentNotification(
          callOperatorId,
          leadId,
          'New Lead Assigned'
        );
      }
      fetchLeads();
    } catch (error: any) {
      console.error('Error reassigning cancelled leads:', error.message);
      Alert.alert('Error', `Failed to reassign leads: ${error.message}`);
    }
  };

  const getTransitLeads = useCallback(async (): Promise<Lead[]> => {
    const { data, error } = await supabase.from('leads').select('*').eq('status', 'transit');
    if (error) {
      console.error('Error fetching transit leads:', error);
      return [];
    }
    return data || [];
  }, []);

  const generateCustomerId = async (propertyType: string): Promise<string> => {
    try {
      let prefix = '';
      switch (propertyType.toLowerCase()) {
        case 'residential':
          prefix = 'RE';
          break;
        case 'commercial':
          prefix = 'CO';
          break;
        case 'industrial':
          prefix = 'IN';
          break;
        default:
          prefix = 'CU';
      }
      const { data: existingCustomers, error } = await supabase
        .from('customers')
        .select('customer_id')
        .ilike('customer_id', `${prefix}%`);
      if (error) throw error;
      let nextNumber = 1;
      if (existingCustomers && existingCustomers.length > 0) {
        const numbers = existingCustomers
          .map((c: any) => parseInt(c.customer_id.replace(prefix, '')))
          .filter((n: number) => !isNaN(n))
          .sort((a: number, b: number) => b - a);
        if (numbers.length > 0) {
          nextNumber = numbers[0] + 1;
        }
      }
      return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
    } catch (error: any) {
      console.error('Error generating customer ID:', error.message);
      const timestamp = Date.now().toString().slice(-6);
      return `CU${timestamp}`;
    }
  };

  const updateCustomerProjectStatus = async (customerId: string, status: ProjectStatus): Promise<void> => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ project_status: status, updated_at: new Date().toISOString() })
        .eq('id', customerId);
      if (error) throw error;
      setCustomers(prevCustomers =>
        prevCustomers.map(c =>
          c.id === customerId ? { ...c, project_status: status } : c
        )
      );
    } catch (error: any) {
      console.error('Error updating customer project status:', error.message);
      Alert.alert('Error', `Failed to update project status: ${error.message}`);
      throw error;
    }
  };

  const logCall = async (logData: { leadId?: string; customerId?: string; status?: LeadStatus, notes?: string }) => {
    if (!user) {
      throw new Error("User context is not available for logging.");
    }
    const logPayload = {
        user_id: user.id,
        caller_id: user.id,
        lead_id: logData.leadId,
        customer_id: logData.customerId,
        status_at_call: logData.status,
        notes: logData.notes,
    };
    console.log('Attempting to insert into call_logs:', JSON.stringify(logPayload, null, 2));
    const { data, error } = await supabase.from('call_logs').insert(logPayload).select();
    if (error) {
      console.error('Supabase insert error in logCall:', error);
      throw error;
    }
  };

  const getCallLogs = (leadId?: string, customerId?: string): CallLog[] => {
    if (leadId) {
      return callLogs.filter(log => log.lead_id === leadId);
    }
    if (customerId) {
      return callLogs.filter(log => log.customer_id === customerId);
    }
    return [];
  };

  const updateLeadStatusWithLog = async (leadId: string, status: LeadStatus, notes?: string): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      throw new Error('User not authenticated.');
    }
    try {
      await logCall({ leadId, status, notes });
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);
      if (updateError) throw updateError;
      refreshData();
    } catch (error: any) {
      console.error('Error in updateLeadStatusWithLog:', error);
      Alert.alert(
        'Database Error',
        `Operation failed. Could not save call log. Please check the console for details. \n\nError: ${error.message}`
      );
      throw error;
    }
  };

  const addPredefinedMessage = async (messageData: CreateMessageData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const { data, error } = await supabase.from('predefined_messages').insert({
        title: messageData.title,
        message: messageData.message,
        category: messageData.category,
        created_by: user.id,
        is_active: true,
      }).select();
      if (error) {
        console.error('❌ Supabase error details:', { message: error.message, details: error.details, hint: error.hint, code: error.code });
        throw error;
      }
      if (data && data.length > 0) {
        const newMessage = data[0] as PredefinedMessage;
        setPredefinedMessages(prev => [newMessage, ...prev]);
      }
    } catch (error: any) {
      console.error('❌ Error adding predefined message:', error);
      Alert.alert('Error', `Failed to add predefined message: ${error.message}`);
      throw error;
    }
  };

  const updatePredefinedMessage = async (messageId: string, messageData: UpdateMessageData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const updateData: any = {};
      if (messageData.title !== undefined) updateData.title = messageData.title;
      if (messageData.message !== undefined) updateData.message = messageData.message;
      if (messageData.category !== undefined) updateData.category = messageData.category;
      if (messageData.is_active !== undefined) updateData.is_active = messageData.is_active;
      const { error } = await supabase
        .from('predefined_messages')
        .update(updateData)
        .eq('id', messageId);
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      await fetchPredefinedMessages();
    } catch (error: any) {
      console.error('Error updating predefined message:', error.message);
      Alert.alert('Error', `Failed to update predefined message: ${error.message}`);
      throw error;
    }
  };

  const deletePredefinedMessage = async (messageId: string): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const { error } = await supabase.from('predefined_messages').delete().eq('id', messageId);
      if (error) throw error;
      await fetchPredefinedMessages();
    } catch (error: any) {
      console.error('Error deleting predefined message:', error.message);
      Alert.alert('Error', `Failed to delete predefined message: ${error.message}`);
    }
  };

  const getPredefinedMessages = (): PredefinedMessage[] => {
    return predefinedMessages;
  };

  const getPredefinedMessagesByCategory = (category: string): PredefinedMessage[] => {
    return predefinedMessages.filter(message => message.category === category);
  };

  const value = {
    leads,
    supportTickets,
    customers,
    callLaterLogs,
    callLogs,
    predefinedMessages,
    addLead,
    updateLeadStatus,
    updateLeadStatusWithCallLater,
    assignLeadToTechnician,
    assignLeadToCallOperator,
    reassignLead,
    reassignLeadFromOperator,
    bulkAssignLeadsToCallOperator,
    bulkAssignLeadsToTechnician,
    scheduleCall,
    getUnassignedLeads,
    getUnassignedToCallOperators,
    getUnassignedToTechnicians,
    getLeadsByUser,
    getScheduledCallsForToday,
    rescheduleLead,
    convertLeadToCustomer,
    convertLeadToCustomerWithDetails,
    addSupportTicket,
    updateTicketStatus,
    assignTicketToTechnician,
    addCustomer,
    updateCustomer,
    getUserLeads,
    getUserTickets,
    getAllUsers,
    getTechnicians,
    getCallOperators,
    getTeamLeads,
    getSalesmen,
    getLeadsBySalesman,
    getUserWorkStats,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    bulkImportLeads,
    getAnalytics,
    addCallLaterLog,
    getCallLaterLogs,
    getCallLaterLogsByOperator,
    searchLeadsByPhone,
    getCancelledLeads,
    bulkReassignCancelledLeads,
    getTransitLeads,
    generateCustomerId,
    updateCustomerProjectStatus,
    logCall,
    getCallLogs,
    addPredefinedMessage,
    updatePredefinedMessage,
    deletePredefinedMessage,
    getPredefinedMessages,
    getPredefinedMessagesByCategory,
    isLoading,
    refreshData,
    fetchLeads,
    leadPage,
    totalLeadsCount,
    setLeadPage,
    leadPageSize,
    setLeadPageSize,
    updateLeadStatusWithLog,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};