// contexts/DataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Lead, NewLeadData, LeadStatus, RescheduleData, ScheduleCallData, CallLaterLog, CallLaterData, LeadStatusUpdateData, DuplicateLeadLog, DuplicateLeadInfo } from '@/types/leads';
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
  duplicateLeadLogs: DuplicateLeadLog[];
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
  getUnassignedLeads: () => Lead[];
  getUnassignedToCallOperators: () => Lead[];
  getUnassignedToTechnicians: () => Lead[];
  getLeadsByUser: (userId: string, userRole: string) => Lead[];
  getScheduledCallsForToday: (userId: string) => Lead[];
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
  getActiveUsers: () => AppUserFromDB[];
  getTechnicians: () => AppUserFromDB[];
  getCallOperators: () => AppUserFromDB[];
  getTeamLeads: () => AppUserFromDB[];
  getSalesmen: () => AppUserFromDB[];
  getLeadsBySalesman: (salesmanId: string) => Lead[];
  getUserWorkStats: (userId: string) => any;
  addUser: (userData: any) => Promise<void>;
  updateUser: (userId: string, userData: any) => Promise<void>;
  deleteUser: (userId: string, reassignToUserId?: string) => Promise<void>;
  toggleUserStatus: (userId: string, currentStatus: boolean) => Promise<void>;
  bulkImportLeads: (leadsData: NewLeadData[]) => Promise<void>;
  getAnalytics: () => any;
  addCallLaterLog: (data: CallLaterData) => Promise<void>;
  getCallLaterLogs: (leadId: string) => CallLaterLog[];
  getCallLaterLogsByOperator: (operatorId: string) => CallLaterLog[];
  searchLeadsByPhone: (phoneNumber: string) => Lead[];
  getCancelledLeads: () => Lead[];
  bulkReassignCancelledLeads: (leadIds: string[], callOperatorId: string) => Promise<void>;
  getTransitLeads: () => Lead[];
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
  // Duplicate Lead Logs functions
  fetchDuplicateLeadLogs: () => Promise<void>;
  getDuplicateLeadInfo: (logId: string) => DuplicateLeadInfo | null;

  isLoading: boolean;
  refreshData: () => Promise<void>;
  fetchLeads: () => Promise<void>;
  fetchNextLeadPage: () => Promise<void>;
  fetchPrevLeadPage: () => Promise<void>;
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
  const [duplicateLeadLogs, setDuplicateLeadLogs] = useState<DuplicateLeadLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, signOut } = useAuth();

  // Function to fetch all leads from Supabase
  const fetchLeads = async () => {
    try {
      // Check if user is still active before fetching data
      if (user && !user.isActive) {
        console.log('❌ User is deactivated, cannot fetch leads');
        return;
      }

      console.log('🔍 Fetching leads from Supabase with enhanced security...');
      
      // Use enhanced data access with user status validation
      const { data, error } = await supabase.functions.invoke('enhancedDataAccess', {
        body: {
          action: 'select',
          table: 'leads',
          operation: 'select',
          filters: null // Will use RLS policies automatically
        }
      });

      if (error) {
        console.error('❌ Error fetching leads:', error);
        throw error;
      }

      if (data?.error === 'Account deactivated') {
        // User was deactivated during the request
        console.log('❌ User account deactivated during request');
        await signOut();
        return;
      }

      console.log('✅ Leads fetched successfully with database-level security:', data?.data?.length || 0, 'leads found');
      
      // Map snake_case fields to match the updated Lead interface
      const mappedLeads = (data?.data || []).map((lead: any) => ({
        id: lead.id,
        customer_name: lead.customer_name,
        phone_number: lead.phone_number,
        additional_phone: lead.additional_phone,
        email: lead.email,
        address: lead.address,
        property_type: lead.property_type,
        likelihood: lead.likelihood,
        status: lead.status,
        salesman_id: lead.salesman_id,
        salesman_name: lead.salesman_name,
        call_operator_id: lead.call_operator_id,
        call_operator_name: lead.call_operator_name,
        created_by_name: lead.created_by_name,
        technician_id: lead.technician_id,
        technician_name: lead.technician_name,
        call_notes: lead.call_notes,
        visit_notes: lead.visit_notes,
        follow_up_date: lead.follow_up_date,
        rescheduled_date: lead.rescheduled_date,
        rescheduled_by: lead.rescheduled_by,
        reschedule_reason: lead.reschedule_reason,
        scheduled_call_date: lead.scheduled_call_date,
        scheduledCallTime: lead.scheduledCallTime,
        scheduled_call_reason: lead.scheduled_call_reason,
        customer_id: lead.customer_id,
        call_later_count: lead.call_later_count,
        last_call_later_date: lead.last_call_later_date,
        last_call_later_reason: lead.last_call_later_reason,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      }));
      setLeads(mappedLeads);
    } catch (error: any) {
      console.error('❌ Error fetching leads:', error.message);
      Alert.alert('Error', 'Failed to fetch leads. Please check your connection.');
    }
  };

  // Function to fetch customers from Supabase
  const fetchCustomers = async () => {
    try {
      // Check if user is still active before fetching data
      if (user && !user.isActive) {
        console.log('❌ User is deactivated, cannot fetch customers');
        return;
      }

      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      // Map snake_case fields to camelCase
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
  };

  // Function to fetch users from your custom 'app_users' table
  const fetchAppUsers = async () => {
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
  };

  // Function to fetch support tickets
  const fetchSupportTickets = async () => {
    try {
      const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setSupportTickets(data || []);
    } catch (error: any) {
      console.error('Error fetching support tickets:', error.message);
      Alert.alert('Error', 'Failed to fetch support tickets. Please check your connection.');
    }
  };

  // Function to fetch call later logs
  const fetchCallLaterLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('call_later_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Map snake_case to match the updated CallLaterLog interface
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
  };



  const fetchCallLogs = async () => {
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
  };

  // Function to fetch predefined messages from Supabase
  const fetchPredefinedMessages = async () => {
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
      // Don't show alert for predefined messages as they're not critical
    }
  };



  useEffect(() => {
    if (isAuthenticated && user) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([
          fetchLeads(), 
          fetchAppUsers(), 
          fetchSupportTickets(), 
          fetchCustomers(),
          fetchCallLaterLogs(),
          fetchDuplicateLeadLogs(), // Added fetchDuplicateLeadLogs
          fetchCallLogs(),
          fetchPredefinedMessages(),// Added fetchTeamLeadAssignments
        ]);
        setIsLoading(false);
      };
      loadData();
      
      // Set up periodic user status check every 5 minutes
      const statusCheckInterval = setInterval(async () => {
        if (user) {
          try {
            const { data, error } = await supabase
              .from('app_users')
              .select('is_active')
              .eq('id', user.id)
              .single();
            
            if (error || !data || !data.is_active) {
              // User is deactivated or not found, clear data and redirect to login
              console.log('❌ User status check failed or user deactivated');
              setLeads([]);
              setSupportTickets([]);
              setCustomers([]);
              setAppUsers([]);
              setCallLaterLogs([]);
              setDuplicateLeadLogs([]);
              setCallLogs([]);
              setPredefinedMessages([]);
              
              // Show alert and redirect to login
              Alert.alert(
                'Account Deactivated',
                'Your account has been deactivated. You will be redirected to login.',
                [{ text: 'OK' }]
              );
            }
          } catch (error) {
            console.error('Error checking user status:', error);
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
      
      return () => clearInterval(statusCheckInterval);
    } else {
      setLeads([]);
      setSupportTickets([]);
      setCustomers([]);
      setAppUsers([]);
      setCallLaterLogs([]);
      setDuplicateLeadLogs([]); // Added setDuplicateLeadLogs
      setCallLogs([]);
      setPredefinedMessages([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const addLead = async (leadData: NewLeadData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    // Check if user is still active
    if (!user.isActive) {
      Alert.alert('Error', 'Your account has been deactivated. Please contact your administrator.');
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
      }).select();
      
      if (error) throw error;
      if (data) {
        setLeads(prev => [data[0] as Lead, ...prev]);
      }
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

    // Check if user is still active
    if (!user.isActive) {
      Alert.alert('Error', 'Your account has been deactivated. Please contact your administrator.');
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
      fetchLeads(); // Refresh leads after update
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
      
      // Get lead details for notification
      const lead = leads.find(l => l.id === rescheduleData.leadId);
      if (lead) {
        // Create notification for the call operator
        await NotificationService.createRescheduleNotification(
          rescheduleData.rescheduledBy,
          rescheduleData.leadId,
          lead.customer_name,
          rescheduleData.newDate,
          rescheduleData.reason
        );
        
        // Show local notification
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

      // Create customer record
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

      // Update lead with customer reference
      const { error: leadError } = await supabase.from('leads').update({
        customer_id: customer[0].id,
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', leadId);

      if (leadError) throw leadError;

      // Create notification for lead completion
      if (lead.salesman_id) {
        await NotificationService.createLeadCompletionNotification(
          lead.salesman_id,
          leadId,
          lead.customer_name
        );
      }

      // Show local notification
      NotificationService.showLocalNotification(
        'Lead Converted',
        `Lead for ${lead.customer_name} has been successfully converted to customer.`
      );

      // Refresh data
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
        updated_at: new Date().toISOString()
      }).eq('id', leadId);
      
      if (error) throw error;
      
      // Create notification for the call operator
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
        updated_at: new Date().toISOString()
      };

      // Clear previous assignments
      updateData.salesman_id = null;
      updateData.salesman_name = null;
      updateData.call_operator_id = null;
      updateData.call_operator_name = null;
      updateData.technician_id = null;
      updateData.technician_name = null;

      // Assign based on role
      switch (newUserRole) {
        case 'salesman':
          updateData.salesman_id = newUserId;
          updateData.salesman_name = newUser.name;
          updateData.status = 'new';
          break;
        case 'call_operator':
          updateData.call_operator_id = newUserId;
          updateData.call_operator_name = newUser.name;
          updateData.status = 'contacted';
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
      
      // Create notification for the new assignee
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

  const getUnassignedLeads = (): Lead[] => {
    return leads.filter(lead => 
      !lead.call_operator_id && 
      !lead.technician_id
    );
  };

  const getUnassignedToCallOperators = (): Lead[] => {
    return leads.filter(lead => !lead.call_operator_id);
  };

  const getUnassignedToTechnicians = (): Lead[] => {
    return leads.filter(lead => !lead.technician_id);
  };

  const getLeadsByUser = (userId: string, userRole: string): Lead[] => {
    // Check if current user is active before returning data
    if (user && !user.isActive) {
      console.log('❌ User is deactivated, cannot access leads');
      return [];
    }

    switch (userRole) {
      case 'salesman':
        return leads.filter(lead => lead.salesman_id === userId);
      case 'call_operator':
        return leads.filter(lead => lead.call_operator_id === userId);
      case 'technician':
        return leads.filter(lead => lead.technician_id === userId);
      default:
        return [];
    }
  };

  const getScheduledCallsForToday = (userId: string): Lead[] => {
    const today = new Date().toDateString();
    return leads.filter(lead => {
      if (lead.call_operator_id !== userId || !lead.scheduled_call_date) return false;
      const scheduledDate = new Date(lead.scheduled_call_date).toDateString();
      return scheduledDate === today;
    });
  };

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
      
      // Create notification for the scheduled call
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
      if (data) {
        setCustomers(prev => [data[0] as Customer, ...prev]);
      }
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
      }));

      const { error } = await supabase.from('leads').insert(leadsToInsert);
      if (error) throw error;
      
      fetchLeads(); // Refresh leads after import
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
      if (data) {
        setSupportTickets(prev => [data[0] as SupportTicket, ...prev]);
      }
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
      fetchSupportTickets(); // Refresh tickets after update
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
    // Get the user's role
    const currentUser = appUsers.find(u => u.id === userId);
    if (!currentUser) return [];

    switch (currentUser.role) {
      case 'salesman':
        return leads.filter(lead => lead.salesman_id === userId);
      case 'call_operator':
        // Call operators only see their assigned leads
        return leads.filter(lead => lead.call_operator_id === userId);
      case 'technician':
        return leads.filter(lead => lead.technician_id === userId);
      case 'super_admin':
      case 'team_lead':
        // Admins and team leads see all leads
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
  const getActiveUsers = () => appUsers.filter(u => u.is_active);
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
        password_hash: userData.password, // This should be hashed in the Edge Function
        is_active: true,
      }).select();
      
      if (error) throw error;
      if (data) {
        setAppUsers(prev => [data[0] as AppUserFromDB, ...prev]);
      }
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
      const { data,error } = await supabase.from('app_users').update({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        password_hash: userData.password,
        updated_at: new Date().toISOString()
      }).eq('id', userId);
      
      if (error) throw error;
      await fetchAppUsers();
    } catch (error: any) {
      console.error('Error updating user:', error.message);
      Alert.alert('Error', `Failed to update user: ${error.message}`);
      throw error;
    }
  };

  const deleteUser = async (userId: string, reassignToUserId?: string): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
      // Check if user is trying to delete themselves
      if (userId === user.id) {
        throw new Error('You cannot delete your own account');
      }

      // Use the Edge Function for proper deletion with reassignment
      const { data, error } = await supabase.functions.invoke('deleteUser', {
        body: { userId, reassignToUserId }
      });

      if (error) throw error;
      
      if (data.success) {
        // Refresh users list
        await fetchAppUsers();
        // Refresh leads to get updated assignments
        await fetchLeads();
      } else {
        throw new Error(data.error || 'Failed to delete user');
      }
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
      // Check if user is trying to deactivate themselves
      if (userId === user.id) {
        throw new Error('You cannot deactivate your own account');
      }

      const { error } = await supabase
        .from('app_users')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Refresh users list
      await fetchAppUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error.message);
      Alert.alert('Error', `Failed to update user status: ${error.message}`);
      throw error;
    }
  };

  const getAnalytics = () => {
    const totalLeads = leads.length;
    const completedLeads = leads.filter(l => l.status === 'completed').length;
    const activeTickets = supportTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;
    const conversionRate = totalLeads > 0 ? (completedLeads / totalLeads * 100).toFixed(1) : '0';

    return {
      totalLeads,
      completedLeads,
      activeTickets,
      conversionRate,
      totalUsers: appUsers.length,
      activeUsers: appUsers.filter(u => u.is_active).length,
      monthlyLeads: leads.filter(l => {
        const leadDate = new Date(l.created_at);
        const now = new Date();
        return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
      }).length
    };
  };

  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    await Promise.all([
      fetchLeads(), 
      fetchAppUsers(), 
      fetchSupportTickets(), 
      fetchCustomers(),
      fetchCallLaterLogs(),
      fetchDuplicateLeadLogs(), // Added fetchDuplicateLeadLogs
      fetchCallLogs(),
      fetchPredefinedMessages()
    ]);
    setIsLoading(false);
  };

  const bulkAssignLeadsToCallOperator = async (leadIds: string[], callOperatorId: string): Promise<void> => {
    const callOperator = appUsers.find(u => u.id === callOperatorId);
    if (!callOperator) {
      Alert.alert('Error', 'Call operator not found.');
      return;
    }

    try {
      // Update all leads in batch
      const { error } = await supabase.from('leads').update({
        call_operator_id: callOperatorId,
        call_operator_name: callOperator.name,
        updated_at: new Date().toISOString()
      }).in('id', leadIds);
      
      if (error) throw error;
      
      // Create notifications for the call operator
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
      // Update all leads in batch
      const { error } = await supabase.from('leads').update({
        technician_id: technicianId,
        technician_name: technician.name,
        status: 'transit',
        updated_at: new Date().toISOString()
      }).in('id', leadIds);
      
      if (error) throw error;
      
      // Create notifications for the technician
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

  const getTransitLeads = (): Lead[] => {
    return leads.filter(lead => lead.status === 'transit');
  };

  const getUserWorkStats = (userId: string): any => {
    const userLeads = leads.filter(lead => 
      lead.call_operator_id === userId || 
      lead.technician_id === userId || 
      lead.salesman_id === userId
    );

    const today = new Date().toDateString();
    const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalLeads: userLeads.length,
      leadsToday: userLeads.filter(lead => 
        new Date(lead.created_at).toDateString() === today
      ).length,
      leadsThisWeek: userLeads.filter(lead => 
        new Date(lead.created_at) >= thisWeek
      ).length,
      completedLeads: userLeads.filter(lead => lead.status === 'completed').length,
      pendingLeads: userLeads.filter(lead => 
        ['new', 'contacted', 'hold', 'transit'].includes(lead.status)
      ).length,
      lastActivity: userLeads.length > 0 ? 
        new Date(Math.max(...userLeads.map(l => new Date(l.updated_at).getTime()))) : 
        null
    };
  };

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

  // Implement updateLeadStatusWithCallLater
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
      // If status is hold and call later data is provided, add call later log and update scheduled call fields
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
      await fetchLeads();
    } catch (error: any) {
      console.error('Error updating lead status with call later:', error.message);
      Alert.alert('Error', `Failed to update lead status: ${error.message}`);
    }
  };

  // Implement convertLeadToCustomerWithDetails
  const convertLeadToCustomerWithDetails = async (data: CustomerConversionData): Promise<void> => {
    try {
      const lead = leads.find(l => l.id === data.lead_id);
      if (!lead) {
        Alert.alert('Error', 'Lead not found.');
        return;
      }
      // Generate unique customer ID
      const customerId = await generateCustomerId(lead.property_type);
      // Create customer record with detailed information
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
      // Update lead with customer reference
      const { error: leadError } = await supabase.from('leads').update({
        customer_id: customer[0].id,
        status: 'completed',
        updated_at: new Date().toISOString()
      }).eq('id', data.lead_id);
      if (leadError) throw leadError;
      // Create notification for lead completion
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

  // Implement addCallLaterLog
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

  // Implement getCallLaterLogs
  const getCallLaterLogs = (leadId: string): CallLaterLog[] => {
    return callLaterLogs.filter((log: CallLaterLog) => log.lead_id === leadId);
  };

  // Implement getCallLaterLogsByOperator
  const getCallLaterLogsByOperator = (operatorId: string): CallLaterLog[] => {
    return callLaterLogs.filter((log: CallLaterLog) => log.call_operator_id === operatorId);
  };

  // Implement searchLeadsByPhone
  const searchLeadsByPhone = (phoneNumber: string): Lead[] => {
    const searchTerm = phoneNumber.toLowerCase().trim();
    return leads.filter(lead => 
      lead.phone_number.toLowerCase().includes(searchTerm) ||
      (lead.additional_phone && lead.additional_phone.toLowerCase().includes(searchTerm))
    );
  };

  // Implement getCancelledLeads
  const getCancelledLeads = (): Lead[] => {
    return leads.filter(lead => lead.status === 'declined');
  };

  // Implement bulkReassignCancelledLeads
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
      await fetchLeads();
      Alert.alert('Success', `${leadIds.length} cancelled leads reassigned successfully!`);
    } catch (error: any) {
      console.error('Error reassigning cancelled leads:', error.message);
      Alert.alert('Error', `Failed to reassign leads: ${error.message}`);
    }
  };

  // Implement generateCustomerId
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

      // Update local state
      setCustomers(prevCustomers =>
        prevCustomers.map(c =>
          c.id === customerId ? { ...c, project_status: status } : c
        )
      );
    } catch (error: any) {
      console.error('Error updating customer project status:', error.message);
      Alert.alert('Error', `Failed to update project status: ${error.message}`);
      throw error; // Re-throw to be caught by the calling component
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
      // First, log the call.
      await logCall({ leadId, status, notes });

      // Then, update the lead's status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId);

      if (updateError) throw updateError;

      // Refresh all data
      await refreshData();
    } catch (error: any) {
      console.error('Error in updateLeadStatusWithLog:', error);
      Alert.alert(
        'Database Error',
        `Operation failed. Could not save call log. Please check the console for details. \n\nError: ${error.message}`
      );
      throw error;
    }
  };

  // Implement addPredefinedMessage
  const addPredefinedMessage = async (messageData: CreateMessageData): Promise<void> => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    
    console.log('🔍 Debug: Current user:', user);
    console.log('🔍 Debug: Message data:', messageData);
    
    try {
      const { data, error } = await supabase.from('predefined_messages').insert({
        title: messageData.title,
        message: messageData.message,
        category: messageData.category,
        created_by: user.id,
        is_active: true,
      }).select();
      
      if (error) {
        console.error('❌ Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log('✅ Message created successfully:', data);
      
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

  // Implement updatePredefinedMessage
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
      
      // Refresh the messages list
      await fetchPredefinedMessages();
    } catch (error: any) {
      console.error('Error updating predefined message:', error.message);
      Alert.alert('Error', `Failed to update predefined message: ${error.message}`);
      throw error;
    }
  };

  // Implement deletePredefinedMessage
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

  // Implement getPredefinedMessages
  const getPredefinedMessages = (): PredefinedMessage[] => {
    return predefinedMessages;
  };

  // Implement getPredefinedMessagesByCategory
  const getPredefinedMessagesByCategory = (category: string): PredefinedMessage[] => {
    return predefinedMessages.filter(message => message.category === category);
  };

  // Implement fetchDuplicateLeadLogs
  const fetchDuplicateLeadLogs = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('duplicate_lead_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mappedLogs: DuplicateLeadLog[] = (data || []).map((log: any) => ({
        id: log.id,
        attempted_phone_number: log.attempted_phone_number,
        attempted_customer_name: log.attempted_customer_name,
        attempted_by_id: log.attempted_by_id,
        attempted_by_name: log.attempted_by_name,
        attempted_by_role: log.attempted_by_role,
        existing_lead_id: log.existing_lead_id,
        existing_lead_customer_name: log.existing_lead_customer_name,
        existing_lead_phone_number: log.existing_lead_phone_number,
        existing_lead_status: log.existing_lead_status,
        existing_lead_owner_name: log.existing_lead_owner_name,
        existing_lead_owner_role: log.existing_lead_owner_role,
        attempted_lead_data: log.attempted_lead_data,
        created_at: log.created_at,
      }));
      setDuplicateLeadLogs(mappedLogs);
    } catch (error: any) {
      console.error('Error fetching duplicate lead logs:', error.message);
    }
  };

  // Implement getDuplicateLeadInfo
  const getDuplicateLeadInfo = (logId: string): DuplicateLeadInfo | null => {
    const log = duplicateLeadLogs.find(l => l.id === logId);
    if (!log) return null;

    const existingLead = leads.find(l => l.id === log.existing_lead_id);

    if (!existingLead) return null;

    return {
      duplicateLog: log,
      existingLead: existingLead,
      attemptedLeadData: log.attempted_lead_data,
    };
  };

 
  return (
    <DataContext.Provider value={{
      leads,
      supportTickets,
      customers,
      callLaterLogs,
      callLogs,
      predefinedMessages,
      duplicateLeadLogs,
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
      getActiveUsers,
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
      fetchDuplicateLeadLogs,
      getDuplicateLeadInfo,
      isLoading,
      refreshData,
      fetchLeads,
      fetchNextLeadPage: () => Promise.resolve(),
      fetchPrevLeadPage: () => Promise.resolve(),
      setLeadPageSize: () => {},
      updateLeadStatusWithLog,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};