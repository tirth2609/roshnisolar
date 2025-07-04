import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Users, Phone, UserPlus, Search, CheckCircle } from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';

export default function LeadAssign() {
  const { leads, getAllUsers, bulkAssignLeadsToCallOperator, isLoading, refreshData } = useData();
  const { user } = useAuth();
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Bulk assignment state
  const [bulkCount, setBulkCount] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const allUsers = getAllUsers();
  const operators = allUsers.filter(u => u.role === 'call_operator' && u.is_active);
  const filteredLeads = leads.filter(lead =>
    (!lead.call_operator_id) &&
    (lead.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone_number?.includes(search) ||
      lead.address?.toLowerCase().includes(search))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1); // Reset to first page if search/pageSize changes
  }, [search, pageSize]);

  // Bulk select handler
  const handleBulkSelect = () => {
    const n = parseInt(bulkCount, 10);
    if (isNaN(n) || n <= 0) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }
    // Select first N leads from filteredLeads (not just paginated)
    const toSelect = filteredLeads.slice(0, n).map(l => l.id);
    setSelectedLeads(toSelect);
  };

  const handleBulkAssign = async () => {
    if (!selectedOperator || selectedLeads.length === 0) {
      Alert.alert('Error', 'Please select leads and an operator');
      return;
    }
    try {
      await bulkAssignLeadsToCallOperator(selectedLeads, selectedOperator);
      setShowAssignModal(false);
      setSelectedLeads([]);
      setSelectedOperator('');
      setBulkCount('');
      Alert.alert('Success', `${selectedLeads.length} leads assigned successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to assign leads. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 8 }}>Lead Assignment</Text>
        <Text style={{ color: '#64748B', marginBottom: 16 }}>Assign leads to call operators</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TextInput
            style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, marginRight: 8 }}
            placeholder="Search leads..."
            value={search}
            onChangeText={setSearch}
          />
          <Search size={20} color="#64748B" />
        </View>
      </View>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {paginatedLeads.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Users size={48} color="#CBD5E1" />
            <Text style={{ color: '#64748B', fontSize: 16, marginTop: 12 }}>No unassigned leads found</Text>
          </View>
        ) : (
          paginatedLeads.map(lead => (
            <TouchableOpacity
              key={lead.id}
              style={{
                backgroundColor: selectedLeads.includes(lead.id) ? '#F0FDF4' : '#FFF',
                borderColor: selectedLeads.includes(lead.id) ? '#10B981' : '#E2E8F0',
                borderWidth: 2,
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onPress={() => {
                setSelectedLeads(prev =>
                  prev.includes(lead.id)
                    ? prev.filter(id => id !== lead.id)
                    : [...prev, lead.id]
                );
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 16 }}>{lead.customer_name}</Text>
                <Text style={{ color: '#64748B', fontSize: 14 }}>{lead.phone_number}</Text>
                <Text style={{ color: '#64748B', fontSize: 12 }}>{lead.address}</Text>
              </View>
              {selectedLeads.includes(lead.id) && (
                <CheckCircle size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))
        )}
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 16, gap: 12 }}>
            <TouchableOpacity
              style={{ padding: 8, borderRadius: 6, backgroundColor: page === 1 ? '#E2E8F0' : '#1E40AF', marginHorizontal: 4, opacity: page === 1 ? 0.5 : 1 }}
              disabled={page === 1}
              onPress={() => setPage(page - 1)}
            >
              <Text style={{ color: page === 1 ? '#64748B' : '#FFF', fontWeight: 'bold' }}>Previous</Text>
            </TouchableOpacity>
            <Text style={{ color: '#1E293B', fontWeight: 'bold', marginHorizontal: 8 }}>Page {page} of {totalPages}</Text>
            <TouchableOpacity
              style={{ padding: 8, borderRadius: 6, backgroundColor: page === totalPages ? '#E2E8F0' : '#1E40AF', marginHorizontal: 4, opacity: page === totalPages ? 0.5 : 1 }}
              disabled={page === totalPages}
              onPress={() => setPage(page + 1)}
            >
              <Text style={{ color: page === totalPages ? '#64748B' : '#FFF', fontWeight: 'bold' }}>Next</Text>
            </TouchableOpacity>
            <Text>Page Size:</Text>
            <TextInput
              style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8, marginHorizontal: 8 }}
              value={pageSize.toString()}
              onChangeText={text => {
                const size = parseInt(text, 10);
                if (!isNaN(size) && size > 0) setPageSize(size);
              }}
            />
          </View>
        )}
      </ScrollView>
      <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFF' }}>
        {/* Bulk assignment controls */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <TextInput
            style={{ flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 8 }}
            placeholder="Number of leads to assign"
            value={bulkCount}
            onChangeText={setBulkCount}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={{ backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' }}
            onPress={handleBulkSelect}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Auto-select N Leads</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#1E40AF',
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
            marginBottom: 12,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: selectedLeads.length === 0 ? 0.5 : 1,
          }}
          disabled={selectedLeads.length === 0}
          onPress={() => setShowAssignModal(true)}
        >
          <UserPlus size={20} color="#FFF" />
          <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Assign Selected Leads</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={showAssignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 16 }}>Assign to Call Operator</Text>
            <Picker
              selectedValue={selectedOperator}
              onValueChange={setSelectedOperator}
              style={{ marginBottom: 16 }}
            >
              <Picker.Item label="Select Call Operator" value="" />
              {operators.map(op => (
                <Picker.Item key={op.id} label={op.name} value={op.id} />
              ))}
            </Picker>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#F1F5F9', alignItems: 'center' }}
                onPress={() => setShowAssignModal(false)}
              >
                <Text style={{ color: '#64748B', fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#1E40AF', alignItems: 'center', opacity: !selectedOperator ? 0.5 : 1 }}
                onPress={handleBulkAssign}
                disabled={!selectedOperator}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Assign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 