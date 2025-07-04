import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Clock, MapPin, Building, User, CheckCircle, History } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lead, LeadStatus } from '@/types/leads';
import { CallLog } from '@/types/logs';
import { Picker } from '@react-native-picker/picker';

export default function TransitLeadsPage() {
  const { getTransitLeads, refreshData, updateLeadStatus, logCall, getCallLogs } = useData();
  const { user } = useAuth();
  const [showCallLaterModal, setShowCallLaterModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callLaterDate, setCallLaterDate] = useState('');
  const [callLaterNote, setCallLaterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusNotes, setStatusNotes] = useState('');
  const [newStatus, setNewStatus] = useState<LeadStatus>('contacted');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.ceil(getTransitLeads().length / pageSize);
  const paginatedLeads = getTransitLeads().slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page if pageSize changes
  }, [pageSize]);

  const handleCall = (phoneNumber: string, leadId: string) => {
    logCall({ leadId });
    if (Platform.OS === 'web') {
      Alert.alert('Call Feature', `Would call: ${phoneNumber}\n\nNote: Calling is not available in web preview.`);
    } else {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleViewHistory = (lead: Lead) => {
    setSelectedLead(lead);
    setShowHistoryModal(true);
  };

  const handleCallLater = (lead: Lead) => {
    setSelectedLead(lead);
    setCallLaterDate('');
    setCallLaterNote('');
    setShowCallLaterModal(true);
  };

  const handleStatusUpdate = (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const submitCallLater = async () => {
    if (!selectedLead || !callLaterDate) {
      Alert.alert('Error', 'Please select a date for call later.');
      return;
    }
    setIsSubmitting(true);
    try {
      // You should implement this function in your DataContext or API
      // await markLeadForCallLater(selectedLead.id, callLaterDate, callLaterNote);
      Alert.alert('Success', 'Lead marked for call later!');
      setShowCallLaterModal(false);
      setSelectedLead(null);
      setCallLaterDate('');
      setCallLaterNote('');
      refreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark lead for call later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitStatusUpdate = async () => {
    if (!selectedLead) return;
    try {
      await updateLeadStatus(selectedLead.id, newStatus, statusNotes);
      setShowStatusModal(false);
      setSelectedLead(null);
      setStatusNotes('');
      setNewStatus('contacted');
      refreshData();
      Alert.alert('Success', 'Lead status updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead status');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 }}>
        <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Transit Leads</Text>
        <Text style={{ color: '#E2E8F0', fontSize: 16 }}>Leads in transit, ready for follow-up</Text>
      </LinearGradient>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        {paginatedLeads.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: '#64748B', fontSize: 18 }}>No transit leads available</Text>
          </View>
        ) : (
          paginatedLeads.map((lead) => (
            <View key={lead.id} style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 18 }}>{lead.customer_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Phone size={16} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={{ color: '#64748B', fontSize: 14, marginRight: 12 }}>{lead.phone_number}</Text>
                <MapPin size={16} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={{ color: '#64748B', fontSize: 14, marginRight: 12 }}>{lead.address}</Text>
                <Building size={16} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={{ color: '#64748B', fontSize: 14, marginRight: 12 }}>{lead.property_type}</Text>
                {lead.call_operator_name && <><User size={16} color="#64748B" style={{ marginRight: 4 }} /><Text style={{ color: '#64748B', fontSize: 14 }}>Operator: {lead.call_operator_name}</Text></>}
              </View>
              <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 8, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={() => handleCall(lead.phone_number, lead.id)}>
                  <Phone size={18} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#F59E0B', borderRadius: 8, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={() => handleCallLater(lead)}>
                  <Clock size={18} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Call Later</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#2563EB', borderRadius: 8, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={() => handleStatusUpdate(lead)}>
                  <CheckCircle size={18} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Update Status</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, backgroundColor: '#64748B', borderRadius: 8, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={() => handleViewHistory(lead)}>
                  <History size={18} color="#FFF" />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>History ({getCallLogs(lead.id).length})</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {/* Call Later Modal */}
      <Modal visible={showCallLaterModal} transparent animationType="slide" onRequestClose={() => setShowCallLaterModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: 340 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>Call Later</Text>
            {selectedLead && <Text style={{ color: '#64748B', marginBottom: 12 }}>Lead: {selectedLead.customer_name}</Text>}
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 }}
              placeholder="Call Later Date (YYYY-MM-DD)"
              value={callLaterDate}
              onChangeText={setCallLaterDate}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, height: 60, textAlignVertical: 'top' }}
              placeholder="Notes (optional)"
              value={callLaterNote}
              onChangeText={setCallLaterNote}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={() => setShowCallLaterModal(false)}>
                <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={submitCallLater} disabled={isSubmitting}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>{isSubmitting ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Status Update Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide" onRequestClose={() => setShowStatusModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: 340 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>Update Lead Status</Text>
            {selectedLead && <Text style={{ color: '#64748B', marginBottom: 12 }}>Lead: {selectedLead.customer_name}</Text>}
            <Text style={{ fontSize: 16, color: '#1E293B', marginBottom: 8 }}>Change Status</Text>
            <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginBottom: 12 }}>
              <Picker
                selectedValue={newStatus}
                onValueChange={(itemValue) => setNewStatus(itemValue as LeadStatus)}
              >
                <Picker.Item label="Contacted" value="contacted" />
                <Picker.Item label="Hold" value="hold" />
                <Picker.Item label="Transit" value="transit" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Declined" value="declined" />
              </Picker>
            </View>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16, height: 60, textAlignVertical: 'top' }}
              placeholder="Add notes about this status update..."
              value={statusNotes}
              onChangeText={setStatusNotes}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={() => setShowStatusModal(false)}>
                <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={submitStatusUpdate}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Call History Modal */}
      <Modal visible={showHistoryModal} transparent animationType="slide" onRequestClose={() => setShowHistoryModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: 340 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>Call History</Text>
            {selectedLead && <Text style={{ color: '#64748B', marginBottom: 12 }}>Lead: {selectedLead.customer_name}</Text>}
            <ScrollView style={{maxHeight: 300}}>
              {selectedLead && getCallLogs(selectedLead.id).length > 0 ? (
                getCallLogs(selectedLead.id).map((log: CallLog) => (
                  <View key={log.id} style={{borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 8}}>
                    <Text style={{fontSize: 14, color: '#1E293B'}}>Called by: {log.caller_name}</Text>
                    <Text style={{fontSize: 12, color: '#64748B'}}>On: {new Date(log.created_at).toLocaleString()}</Text>
                  </View>
                ))
              ) : (
                <Text style={{color: '#64748B', textAlign: 'center', marginTop: 20}}>No call history found for this lead.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={() => setShowHistoryModal(false)}>
              <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Pagination Controls */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 16, gap: 12 }}>
        <TouchableOpacity onPress={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Previous</TouchableOpacity>
        <Text>Page {currentPage} of {totalPages}</Text>
        <TouchableOpacity onPress={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</TouchableOpacity>
        <Text>Page Size:</Text>
        <TextInput value={pageSize.toString()} onChangeText={text => { const size = parseInt(text, 10); if (!isNaN(size) && size > 0) setPageSize(size); }} />
      </View>
    </View>
  );
} 