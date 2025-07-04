import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, RefreshControl, Modal, TextInput, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Lead, LeadStatus, CallLaterLog } from '../types/leads';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import { Phone, FileText, CheckCircle, TrendingUp, Edit, Clock, Plus, Wrench, MessageCircle } from 'lucide-react-native';

const PAGE_SIZE = 10;

export default function MyLeadsPage({ routerBase = "" }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCallLogModal, setShowCallLogModal] = useState(false);
  const [showCallLaterModal, setShowCallLaterModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newStatus, setNewStatus] = useState<LeadStatus>('new');
  const [statusNotes, setStatusNotes] = useState('');
  const [callLogNotes, setCallLogNotes] = useState('');
  const [callLaterDate, setCallLaterDate] = useState('');
  const [callLaterReason, setCallLaterReason] = useState('');
  const [callLaterNotes, setCallLaterNotes] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchLeads = async () => {
    if (!user) return;
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (user.role === 'salesman') {
      query = query.or(`salesman_id.eq.${user.id},created_by.eq.${user.id}`);
    } else if (user.role === 'call_operator') {
      query = query.or(`call_operator_id.eq.${user.id},created_by.eq.${user.id}`);
    } // team_lead and super_admin see all leads
    const { data, error } = await query;
    if (error) {
      Alert.alert('Error', 'Failed to fetch leads');
    } else {
      setLeads(data as Lead[]);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  // Filtered and paginated leads
  const filteredLeads = leads.filter(lead =>
    lead.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    lead.phone_number?.includes(search) ||
    lead.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const paginatedLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Status Change
  const openStatusModal = (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setStatusNotes('');
    setShowStatusModal(true);
  };
  const handleStatusChange = async () => {
    if (!selectedLead) return;
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus, call_notes: statusNotes })
      .eq('id', selectedLead.id);
    if (error) {
      Alert.alert('Error', 'Failed to update status');
    } else {
      setShowStatusModal(false);
      fetchLeads();
    }
  };

  // Call Log
  const openCallLogModal = (lead: Lead) => {
    setSelectedLead(lead);
    setCallLogNotes('');
    setShowCallLogModal(true);
  };
  const handleCallLog = async () => {
    if (!selectedLead || !user) return;
    // Insert a log (assuming a logs table exists)
    const { error } = await supabase.from('logs').insert({
      lead_id: selectedLead.id,
      user_id: user.id,
      user_name: user.name,
      type: 'call',
      notes: callLogNotes,
      created_at: new Date().toISOString(),
    });
    if (error) {
      Alert.alert('Error', 'Failed to log call');
    } else {
      setShowCallLogModal(false);
      Alert.alert('Success', 'Call logged!');
    }
  };

  // Call Later Log
  const openCallLaterModal = (lead: Lead) => {
    setSelectedLead(lead);
    setCallLaterDate('');
    setCallLaterReason('');
    setCallLaterNotes('');
    setShowCallLaterModal(true);
  };
  const handleCallLaterLog = async () => {
    if (!selectedLead || !user) return;
    const { error } = await supabase.from('call_later_logs').insert({
      lead_id: selectedLead.id,
      call_operator_id: user.id,
      call_operator_name: user.name,
      call_later_date: callLaterDate,
      reason: callLaterReason,
      notes: callLaterNotes,
      created_at: new Date().toISOString(),
    });
    if (error) {
      Alert.alert('Error', 'Failed to log call later');
    } else {
      setShowCallLaterModal(false);
      Alert.alert('Success', 'Call later logged!');
    }
  };

  // View Logs
  const openLogsModal = async (lead: Lead) => {
    setSelectedLead(lead);
    // Fetch logs for this lead
    const { data: call_logs } = await supabase.from('logs').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
    const { data: call_later_logs } = await supabase.from('call_later_logs').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
    setLogs([...(call_logs || []), ...(call_later_logs || [])].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')));
    setShowLogsModal(true);
  };

  const handleConvertToCustomer = async (lead: Lead) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: 'completed' })
      .eq('id', lead.id);
    if (error) {
      Alert.alert('Error', 'Failed to convert lead');
    } else {
      Alert.alert('Success', 'Lead converted to customer!');
      fetchLeads();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Work Tracking Button at the top */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity style={{ backgroundColor: '#10B981', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push((`${routerBase}/work-tracking`) as any)}>
          <Wrench size={18} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Work Tracking</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>My Leads</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 16, padding: 10, color: theme.text }}
          placeholder="Search by name, phone, or email"
          value={search}
          onChangeText={setSearch}
        />
        {paginatedLeads.length === 0 ? (
          <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>No leads found.</Text>
        ) : (
          paginatedLeads.map(lead => (
            <TouchableOpacity
              key={lead.id}
              style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' }}
              onPress={() => router.push({ pathname: (`${routerBase}/lead-info` as any), params: { id: lead.id } })}
            >
              <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 16 }}>{lead.customer_name}</Text>
              <Text style={{ color: '#64748B', fontSize: 14 }}>{lead.phone_number}</Text>
              <Text style={{ color: '#64748B', fontSize: 14 }}>Status: {lead.status}</Text>
              {/* Action Buttons Row */}
              <View style={{ flexDirection: 'row', marginTop: 10, gap: 18 }}>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${lead.phone_number}`)}>
                  <Phone size={22} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openCallLaterModal(lead)}>
                  <Clock size={22} color="#F59E0B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${lead.phone_number.replace(/\D/g, '')}`)}>
                  <MessageCircle size={22} color="#25D366" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openLogsModal(lead)}>
                  <FileText size={22} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
            <TouchableOpacity
              style={{ padding: 10, backgroundColor: page === 1 ? '#E5E7EB' : '#3B82F6', borderRadius: 6, marginRight: 8 }}
              disabled={page === 1}
              onPress={() => setPage(page - 1)}
            >
              <Text style={{ color: page === 1 ? '#64748B' : '#FFF' }}>Previous</Text>
            </TouchableOpacity>
            <Text style={{ marginHorizontal: 8, color: theme.text }}>Page {page} of {totalPages}</Text>
            <TouchableOpacity
              style={{ padding: 10, backgroundColor: page === totalPages ? '#E5E7EB' : '#3B82F6', borderRadius: 6, marginLeft: 8 }}
              disabled={page === totalPages}
              onPress={() => setPage(page + 1)}
            >
              <Text style={{ color: page === totalPages ? '#64748B' : '#FFF' }}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      {/* Floating Action Button for Create Lead */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 24,
          bottom: 32,
          backgroundColor: '#3B82F6',
          borderRadius: 32,
          width: 56,
          height: 56,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        }}
        onPress={() => router.push('/create-lead')}
      >
        <Plus size={28} color="#FFF" />
      </TouchableOpacity>
      {/* Status Change Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide" onRequestClose={() => setShowStatusModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Change Status</Text>
            <Text>Current: {selectedLead?.status}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
              placeholder="New Status (e.g. contacted, hold, transit, etc.)"
              value={newStatus}
              onChangeText={text => setNewStatus(text as LeadStatus)}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
              placeholder="Notes (optional)"
              value={statusNotes}
              onChangeText={setStatusNotes}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowStatusModal(false)} style={{ padding: 10 }}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleStatusChange} style={{ padding: 10, backgroundColor: '#3B82F6', borderRadius: 6 }}><Text style={{ color: '#FFF' }}>Update</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Call Log Modal */}
      <Modal visible={showCallLogModal} transparent animationType="slide" onRequestClose={() => setShowCallLogModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Log Call</Text>
            <Text>Lead: {selectedLead?.customer_name}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
              placeholder="Call Notes"
              value={callLogNotes}
              onChangeText={setCallLogNotes}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowCallLogModal(false)} style={{ padding: 10 }}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleCallLog} style={{ padding: 10, backgroundColor: '#10B981', borderRadius: 6 }}><Text style={{ color: '#FFF' }}>Log</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Call Later Modal */}
      <Modal visible={showCallLaterModal} transparent animationType="slide" onRequestClose={() => setShowCallLaterModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: 320 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Log Call Later</Text>
            <Text>Lead: {selectedLead?.customer_name}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
              placeholder="Call Later Date (YYYY-MM-DD)"
              value={callLaterDate}
              onChangeText={setCallLaterDate}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
              placeholder="Reason"
              value={callLaterReason}
              onChangeText={setCallLaterReason}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, marginVertical: 8, padding: 8 }}
              placeholder="Notes (optional)"
              value={callLaterNotes}
              onChangeText={setCallLaterNotes}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowCallLaterModal(false)} style={{ padding: 10 }}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleCallLaterLog} style={{ padding: 10, backgroundColor: '#F59E0B', borderRadius: 6 }}><Text style={{ color: '#FFF' }}>Log</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Logs Modal */}
      <Modal visible={showLogsModal} transparent animationType="slide" onRequestClose={() => setShowLogsModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: 340, maxHeight: 500 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Logs for {selectedLead?.customer_name}</Text>
            <ScrollView style={{ maxHeight: 350 }}>
              {logs.length === 0 ? (
                <Text>No logs found.</Text>
              ) : (
                logs.map((log, idx) => (
                  <View key={idx} style={{ marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold' }}>{log.type === 'call' ? 'Call Log' : 'Call Later'}</Text>
                    <Text>Date: {log.created_at || log.call_later_date}</Text>
                    <Text>By: {log.user_name || log.call_operator_name}</Text>
                    <Text>Notes: {log.notes || log.reason}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowLogsModal(false)} style={{ marginTop: 16, alignSelf: 'center' }}>
              <Text style={{ color: '#3B82F6' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
} 