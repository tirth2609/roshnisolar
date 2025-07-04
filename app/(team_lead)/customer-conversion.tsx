import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  CheckCircle,
  Building,
  Phone,
  MapPin,
  Mail,
  Zap,
  DollarSign,
  FileText,
  CreditCard,
  CalendarDays,
  User,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Lead } from '@/types/leads';
import { CustomerConversionData, Customer } from '@/types/customers';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export default function CustomerConversionPage() {
  const { user } = useAuth();
  const { 
    getTransitLeads,
    convertLeadToCustomerWithDetails,
    isLoading, 
    refreshData,
    customers,
    updateCustomer
  } = useData();
  
  // State for customer conversion
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [selectedLeadForConversion, setSelectedLeadForConversion] = useState<Lead | null>(null);
  const [conversionData, setConversionData] = useState<Partial<CustomerConversionData>>({
    email: '',
    electricity_bill_number: '',
    average_electricity_usage: 0,
    electricity_usage_unit: 'kWh',
    has_paid_first_installment: false,
    payment_method: undefined,
    cash_bill_number: '',
    loan_provider: '',
    loan_amount: 0,
    loan_account_number: '',
    loan_status: 'pending',
    loan_notes: '',
    customer_needs: '',
    preferred_installation_date: undefined,
    special_requirements: '',
    notes: '',
    customer_name: '',
  });

  // 1. Add state for customers and editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editData, setEditData] = useState<Partial<Customer>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.ceil(getTransitLeads().length / pageSize);
  const paginatedLeads = getTransitLeads().slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page if pageSize changes
  }, [pageSize]);

  // Only show transit leads that are not already converted to customers
  const transitLeads = getTransitLeads().filter(lead => !customers.some(c => c.lead_id === lead.id));

  // Handle customer conversion
  const handleConvertToCustomer = (lead: Lead) => {
    setSelectedLeadForConversion(lead);
    setConversionData({
      email: '',
      electricity_bill_number: '',
      average_electricity_usage: 0,
      electricity_usage_unit: 'kWh',
      has_paid_first_installment: false,
      payment_method: undefined,
      cash_bill_number: '',
      loan_provider: '',
      loan_amount: 0,
      loan_account_number: '',
      loan_status: 'pending',
      loan_notes: '',
      customer_needs: '',
      preferred_installation_date: undefined,
      special_requirements: '',
      notes: '',
      customer_name: '',
    });
    setShowConversionModal(true);
  };

  const handleConversionSubmit = async () => {
    if (!selectedLeadForConversion) return;

    // Validate required fields
    if (!conversionData.email || !conversionData.electricity_bill_number || 
        !conversionData.customer_needs || !conversionData.average_electricity_usage || conversionData.average_electricity_usage <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (conversionData.has_paid_first_installment && !conversionData.payment_method) {
      Alert.alert('Error', 'Please select payment method if customer has paid first installment');
      return;
    }

    if (conversionData.payment_method === 'loan' && 
        (!conversionData.loan_provider || !conversionData.loan_account_number || !conversionData.loan_amount || conversionData.loan_amount <= 0)) {
      Alert.alert('Error', 'Please fill in all loan details');
      return;
    }

    try {
      await convertLeadToCustomerWithDetails({
        lead_id: selectedLeadForConversion.id,
        email: conversionData.email!,
        electricity_bill_number: conversionData.electricity_bill_number!,
        average_electricity_usage: conversionData.average_electricity_usage!,
        electricity_usage_unit: conversionData.electricity_usage_unit!,
        has_paid_first_installment: conversionData.has_paid_first_installment!,
        payment_method: conversionData.payment_method,
        cash_bill_number: conversionData.cash_bill_number,
        loan_provider: conversionData.loan_provider,
        loan_amount: conversionData.loan_amount,
        loan_account_number: conversionData.loan_account_number,
        loan_status: conversionData.loan_status,
        loan_notes: conversionData.loan_notes,
        customer_needs: conversionData.customer_needs!,
        preferred_installation_date: conversionData.preferred_installation_date,
        special_requirements: conversionData.special_requirements,
        notes: conversionData.notes,
        customer_name: conversionData.customer_name!,
      });

      setShowConversionModal(false);
      setSelectedLeadForConversion(null);
      Alert.alert('Success', 'Lead converted to customer successfully!');
      refreshData();
    } catch (error) {
      console.error('Error converting lead:', error);
      Alert.alert('Error', 'Failed to convert lead to customer');
    }
  };

  const TransitLeadCard = ({ lead }: { lead: Lead }) => (
    <View style={styles.leadCard}>
      {/* Name row */}
      <View style={styles.leadHeaderSingleRow}>
        <Text style={styles.leadName}>{lead.customer_name}</Text>
        <View style={styles.leadStatus}>
          <Text style={styles.statusText}>Transit</Text>
        </View>
      </View>
      {/* Info row */}
      <View style={styles.leadDetailsColumn}>
        <View style={styles.leadDetailRow}>
          <Phone size={16} color="#64748B" />
          <Text style={styles.leadDetailText}>{lead.phone_number}</Text>
        </View>
        <View style={styles.leadDetailRow}>
          <MapPin size={16} color="#64748B" />
          <Text style={styles.leadDetailText}>{lead.address}</Text>
        </View>
        <View style={styles.leadDetailRow}>
          <Building size={16} color="#64748B" />
          <Text style={styles.leadDetailText}>{lead.property_type}</Text>
        </View>
        {lead.call_operator_name && (
          <View style={styles.leadDetailRow}>
            <User size={16} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.leadDetailText}>Operator: {lead.call_operator_name}</Text>
          </View>
        )}
      </View>
      {/* Button row */}
      <View style={styles.leadActionsFullWidth}>
        <TouchableOpacity
          style={[styles.actionButtonFullWidth, { backgroundColor: '#10B981' }]}
          onPress={() => handleConvertToCustomer(lead)}
        >
          <CheckCircle size={16} color="white" />
          <Text style={styles.actionButtonText}>Convert to Customer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient colors={['#1E40AF', '#3B82F6', '#60A5FA']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>Customer Conversion</Text>
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
          </View>
          
          <Text style={styles.headerSubtitle}>
            Convert transit leads to customers with detailed information
          </Text>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>{transitLeads.length}</Text>
              <Text style={styles.quickStatLabel}>Transit Leads</Text>
            </View>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatNumber}>Ready</Text>
              <Text style={styles.quickStatLabel}>For Conversion</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Transit Leads Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transit Leads Ready for Conversion</Text>
            <Text style={styles.sectionSubtitle}>
              {transitLeads.length} leads ready to be converted to customers
            </Text>
          </View>
          
          {transitLeads.length > 0 ? (
            paginatedLeads.map((lead) => (
              <TransitLeadCard key={lead.id} lead={lead} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No transit leads available</Text>
              <Text style={styles.emptyStateSubtext}>
                Leads will appear here when call operators mark them as "transit"
              </Text>
            </View>
          )}
        </View>

        {/* Add pagination controls below the list */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 16, gap: 12 }}>
          <TouchableOpacity
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Text>Previous</Text>
          </TouchableOpacity>
          <Text>Page {currentPage} of {totalPages}</Text>
          <TouchableOpacity
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text>Next</Text>
          </TouchableOpacity>
          <Text>Page Size:</Text>
          <TextInput
            value={pageSize.toString()}
            onChangeText={text => { const size = parseInt(text, 10); if (!isNaN(size) && size > 0) setPageSize(size); }}
          />
        </View>

        {/* 3. Add Customer List section below Transit Leads */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customers</Text>
            <Text style={styles.sectionSubtitle}>{customers.length} customers</Text>
          </View>
          {customers.length > 0 ? (
            customers.map((customer: Customer) => (
              <View key={customer.id} style={styles.leadCard}>
                <View style={styles.leadHeader}>
                  <Text style={styles.leadName}>{customer.customer_name}</Text>
                  <View style={styles.leadStatus}>
                    <Text style={styles.statusText}>{customer.status}</Text>
                  </View>
                </View>
                <View style={styles.leadDetails}>
                  <View style={styles.leadDetailRow}>
                    <Phone size={16} color="#64748B" />
                    <Text style={styles.leadDetailText}>{customer.phone_number}</Text>
                  </View>
                  <View style={styles.leadDetailRow}>
                    <MapPin size={16} color="#64748B" />
                    <Text style={styles.leadDetailText}>{customer.address}</Text>
                  </View>
                  <View style={styles.leadDetailRow}>
                    <Building size={16} color="#64748B" />
                    <Text style={styles.leadDetailText}>{customer.property_type}</Text>
                  </View>
                </View>
                <View style={styles.leadActionsBelow}>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2563EB' }]} onPress={() => { setSelectedCustomer(customer); setEditData(customer); setShowEditModal(true); }}>
                    <User size={16} color="white" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#EF4444' }]} onPress={async () => { await updateCustomer(customer.id, { status: 'inactive' }); refreshData(); }}>
                    <CheckCircle size={16} color="white" />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No customers yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Add pagination controls below the list */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 16, gap: 12 }}>
          <TouchableOpacity
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Text>Previous</Text>
          </TouchableOpacity>
          <Text>Page {currentPage} of {totalPages}</Text>
          <TouchableOpacity
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text>Next</Text>
          </TouchableOpacity>
          <Text>Page Size:</Text>
          <TextInput
            value={pageSize.toString()}
            onChangeText={text => { const size = parseInt(text, 10); if (!isNaN(size) && size > 0) setPageSize(size); }}
          />
        </View>

      {/* Customer Conversion Modal */}
      <Modal
        visible={showConversionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowConversionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Convert Lead to Customer</Text>
            {selectedLeadForConversion && (
              <Text style={styles.modalSubtitle}>
                Customer: {selectedLeadForConversion.customer_name}
              </Text>
            )}
            
            <ScrollView style={styles.modalScroll}>
              {/* Basic Information */}
              <Text style={styles.modalSectionTitle}>Basic Information</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Email Address *"
                value={conversionData.email}
                onChangeText={(text) => setConversionData({...conversionData, email: text})}
                keyboardType="email-address"
              />
              
              {/* Electricity Details */}
              <Text style={styles.modalSectionTitle}>Electricity Details</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Electricity Bill Number *"
                value={conversionData.electricity_bill_number}
                onChangeText={(text) => setConversionData({...conversionData, electricity_bill_number: text})}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.modalInput, { flex: 2 }]}
                  placeholder="Average Usage *"
                  value={conversionData.average_electricity_usage?.toString()}
                  onChangeText={(text) => setConversionData({...conversionData, average_electricity_usage: parseFloat(text) || 0})}
                  keyboardType="numeric"
                />
                <View style={[styles.modalInput, { flex: 1 }]}>
                  <Picker
                    selectedValue={conversionData.electricity_usage_unit}
                    onValueChange={(value) => setConversionData({...conversionData, electricity_usage_unit: value})}
                  >
                    <Picker.Item label="kWh" value="kWh" />
                    <Picker.Item label="Units" value="Units" />
                  </Picker>
                </View>
              </View>
              
              {/* Payment Information */}
              <Text style={styles.modalSectionTitle}>Payment Information</Text>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setConversionData({
                    ...conversionData, 
                    has_paid_first_installment: !conversionData.has_paid_first_installment
                  })}
                >
                  {conversionData.has_paid_first_installment && (
                    <CheckCircle size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>Customer has paid first installment</Text>
              </View>
              
              {conversionData.has_paid_first_installment && (
                <>
                  <View style={styles.modalInput}>
                    <Picker
                      selectedValue={conversionData.payment_method}
                      onValueChange={(value) => setConversionData({...conversionData, payment_method: value})}
                    >
                      <Picker.Item label="Select Payment Method" value="" />
                      <Picker.Item label="Cash" value="cash" />
                      <Picker.Item label="Loan" value="loan" />
                    </Picker>
                  </View>
                  
                  {conversionData.payment_method === 'cash' && (
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Cash Bill Number"
                      value={conversionData.cash_bill_number}
                      onChangeText={(text) => setConversionData({...conversionData, cash_bill_number: text})}
                    />
                  )}
                  
                  {conversionData.payment_method === 'loan' && (
                    <>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Loan Provider *"
                        value={conversionData.loan_provider}
                        onChangeText={(text) => setConversionData({...conversionData, loan_provider: text})}
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Loan Amount *"
                        value={conversionData.loan_amount?.toString()}
                        onChangeText={(text) => setConversionData({...conversionData, loan_amount: parseFloat(text) || 0})}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Loan Account Number *"
                        value={conversionData.loan_account_number}
                        onChangeText={(text) => setConversionData({...conversionData, loan_account_number: text})}
                      />
                      <View style={styles.modalInput}>
                        <Picker
                          selectedValue={conversionData.loan_status}
                          onValueChange={(value) => setConversionData({...conversionData, loan_status: value})}
                        >
                          <Picker.Item label="Pending" value="pending" />
                          <Picker.Item label="Approved" value="approved" />
                          <Picker.Item label="Disbursed" value="disbursed" />
                          <Picker.Item label="Rejected" value="rejected" />
                        </Picker>
                      </View>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Loan Notes"
                        value={conversionData.loan_notes}
                        onChangeText={(text) => setConversionData({...conversionData, loan_notes: text})}
                        multiline
                      />
                    </>
                  )}
                </>
              )}
              
              {/* Customer Needs */}
              <Text style={styles.modalSectionTitle}>Customer Requirements</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Customer Needs and Requirements *"
                value={conversionData.customer_needs}
                onChangeText={(text) => setConversionData({...conversionData, customer_needs: text})}
                multiline
                textAlignVertical="top"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Preferred Installation Date (YYYY-MM-DD)"
                value={conversionData.preferred_installation_date}
                onChangeText={(text) => setConversionData({...conversionData, preferred_installation_date: text})}
              />
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Special Requirements"
                value={conversionData.special_requirements}
                onChangeText={(text) => setConversionData({...conversionData, special_requirements: text})}
                multiline
                textAlignVertical="top"
              />
              
              {/* Notes */}
              <Text style={styles.modalSectionTitle}>Additional Notes</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Any additional notes..."
                value={conversionData.notes}
                onChangeText={(text) => setConversionData({...conversionData, notes: text})}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConversionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConversionSubmit}
              >
                <Text style={styles.confirmButtonText}>Convert to Customer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Edit Customer Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Customer</Text>
            <ScrollView style={styles.modalScroll}>
              <TextInput style={styles.modalInput} placeholder="Customer Name" value={editData.customer_name || ''} onChangeText={text => setEditData({ ...editData, customer_name: text })} />
              <TextInput style={styles.modalInput} placeholder="Phone Number" value={editData.phone_number || ''} onChangeText={text => setEditData({ ...editData, phone_number: text })} />
              <TextInput style={styles.modalInput} placeholder="Email" value={editData.email || ''} onChangeText={text => setEditData({ ...editData, email: text })} />
              <TextInput style={styles.modalInput} placeholder="Address" value={editData.address || ''} onChangeText={text => setEditData({ ...editData, address: text })} />
              <TextInput style={styles.modalInput} placeholder="Property Type" value={editData.property_type || ''} onChangeText={text => setEditData({ ...editData, property_type: text as any })} />
              <TextInput style={styles.modalInput} placeholder="Electricity Bill Number" value={editData.electricity_bill_number || ''} onChangeText={text => setEditData({ ...editData, electricity_bill_number: text })} />
              <TextInput style={styles.modalInput} placeholder="Average Usage" value={editData.average_electricity_usage?.toString() || ''} onChangeText={text => setEditData({ ...editData, average_electricity_usage: parseFloat(text) || 0 })} keyboardType="numeric" />
              <TextInput style={styles.modalInput} placeholder="Usage Unit" value={editData.electricity_usage_unit || ''} onChangeText={text => setEditData({ ...editData, electricity_usage_unit: text })} />
              <TextInput style={styles.modalInput} placeholder="Customer Needs" value={editData.customer_needs || ''} onChangeText={text => setEditData({ ...editData, customer_needs: text })} />
              <TextInput style={styles.modalInput} placeholder="Preferred Installation Date" value={editData.preferred_installation_date || ''} onChangeText={text => setEditData({ ...editData, preferred_installation_date: text })} />
              <TextInput style={styles.modalInput} placeholder="Special Requirements" value={editData.special_requirements || ''} onChangeText={text => setEditData({ ...editData, special_requirements: text })} />
              <TextInput style={styles.modalInput} placeholder="Notes" value={editData.notes || ''} onChangeText={text => setEditData({ ...editData, notes: text })} />
              {/* Add more fields as needed */}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={async () => { if (selectedCustomer) { await updateCustomer(selectedCustomer.id, editData); setShowEditModal(false); refreshData(); } }}>
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#E2E8F0',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFF',
    marginBottom: 4,
  },
  quickStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 16,
  },
  quickStat: {
    alignItems: 'center' as const,
  },
  quickStatNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFF',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#E2E8F0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  leadCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leadHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  leadHeaderSingleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 4,
  },
  leadName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    flex: 1,
  },
  leadDetails: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  leadDetailsColumn: {
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    gap: 4,
    marginBottom: 12,
  },
  leadDetailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  leadDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  leadStatus: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  leadActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    display: 'none',
  },
  leadActionsBelow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    gap: 8,
    marginTop: 12,
  },
  leadActionsFullWidth: {
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonFullWidth: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center' as const,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: 350,
    maxHeight: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  rowInputs: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  checkboxContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 12,
  },
  checkbox: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
  },
  checkboxLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  modalActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center' as const,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFF',
  },
};