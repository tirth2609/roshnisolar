import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { User } from 'lucide-react-native';

const PAGE_SIZE_DEFAULT = 10;

export default function CustomersPage() {
  const { theme } = useTheme();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (!error) setCustomers(data || []);
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFF' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>Customers</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginTop: 12, padding: 10, color: theme.text }}
          placeholder="Search by name, phone, or email"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {paginated.length === 0 ? (
          <Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>No customers found.</Text>
        ) : (
          paginated.map(customer => (
            <TouchableOpacity
              key={customer.id}
              style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' }}
              onPress={() => { setSelectedCustomer(customer); setShowModal(true); }}
            >
              <User size={28} color={theme.primary} style={{ marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 16 }}>{customer.customer_name}</Text>
                <Text style={{ color: '#64748B', fontSize: 14 }}>{customer.phone_number}</Text>
                <Text style={{ color: '#64748B', fontSize: 14 }}>{customer.email}</Text>
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
            <Text style={{ marginLeft: 16, color: theme.text }}>Page Size:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, width: 48, marginLeft: 8, padding: 4, textAlign: 'center', color: theme.text }}
              keyboardType="number-pad"
              value={String(pageSize)}
              onChangeText={val => {
                const n = Math.max(1, parseInt(val) || PAGE_SIZE_DEFAULT);
                setPageSize(n);
                setPage(1);
              }}
            />
          </View>
        )}
      </ScrollView>
      {/* Customer Info Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 24, width: 340, maxWidth: '90%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 12 }}>Customer Info</Text>
            {selectedCustomer && (
              <>
                <Text style={{ marginBottom: 6 }}><Text style={{ fontWeight: 'bold' }}>Name:</Text> {selectedCustomer.customer_name}</Text>
                <Text style={{ marginBottom: 6 }}><Text style={{ fontWeight: 'bold' }}>Phone:</Text> {selectedCustomer.phone_number}</Text>
                <Text style={{ marginBottom: 6 }}><Text style={{ fontWeight: 'bold' }}>Email:</Text> {selectedCustomer.email}</Text>
                <Text style={{ marginBottom: 6 }}><Text style={{ fontWeight: 'bold' }}>Address:</Text> {selectedCustomer.address}</Text>
                <Text style={{ marginBottom: 6 }}><Text style={{ fontWeight: 'bold' }}>Created At:</Text> {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleString() : '-'}</Text>
                <Text style={{ marginBottom: 6 }}><Text style={{ fontWeight: 'bold' }}>Updated At:</Text> {selectedCustomer.updated_at ? new Date(selectedCustomer.updated_at).toLocaleString() : '-'}</Text>
              </>
            )}
            <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginTop: 16, alignSelf: 'center', backgroundColor: '#3B82F6', borderRadius: 8, padding: 10 }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
} 