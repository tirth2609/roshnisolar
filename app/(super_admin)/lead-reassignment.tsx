import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Users,
  Phone,
  Calendar,
  MapPin,
  Clock,
  LayoutGrid,
  List,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Lead } from '@/types/leads';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const statusOptions = ['All', 'new', 'transit', 'ringing', 'hold', 'contacted', 'completed', 'declined'];

export default function LeadReassignmentScreen() {
  const { user } = useAuth();
  const { getUserLeads, getCallOperators, reassignLeadFromOperator, isLoading } = useData();
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showReassignmentModal, setShowReassignmentModal] = useState(false);
  const [targetOperatorId, setTargetOperatorId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState('All');
  const [operatorView, setOperatorView] = useState('grid');
  const router = useRouter();

  const operators = getCallOperators();
  const operatorLeads = selectedOperator ? getUserLeads(selectedOperator) : [];

  const filteredOperatorLeads = operatorLeads.filter(lead => {
    const matchesSearch =
      lead.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone_number?.includes(searchQuery) ||
      lead.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'All' || lead.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const paginatedLeads = filteredOperatorLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allSelectedOnPage = paginatedLeads.length > 0 && paginatedLeads.every(lead => selectedLeads.includes(lead.id));

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  };

  const toggleSelectAllOnPage = () => {
    if (allSelectedOnPage) {
      setSelectedLeads(selectedLeads.filter(id => !paginatedLeads.some(lead => lead.id === id)));
    } else {
      setSelectedLeads([...new Set([...selectedLeads, ...paginatedLeads.map(lead => lead.id)])]);
    }
  };

  const handleBulkReassign = async () => {
    if (selectedLeads.length === 0 || !targetOperatorId) {
      Alert.alert('Error', 'Please select at least one lead and a target operator');
      return;
    }
    try {
      for (const leadId of selectedLeads) {
        const lead = operatorLeads.find(l => l.id === leadId);
        if (lead) {
          await reassignLeadFromOperator(lead.id, lead.call_operator_id || '', targetOperatorId);
        }
      }
      setShowReassignmentModal(false);
      setSelectedLeads([]);
      setTargetOperatorId('');
      Alert.alert('Success', 'Selected leads reassigned successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to reassign selected leads');
    }
  };

  const handleReassignLead = async () => {
    if (!selectedLead || !targetOperatorId) {
      Alert.alert('Error', 'Please select a lead and target operator');
      return;
    }

    try {
      await reassignLeadFromOperator(
        selectedLead.id,
        selectedLead.call_operator_id || '',
        targetOperatorId
      );
      setShowReassignmentModal(false);
      setSelectedLead(null);
      setTargetOperatorId('');
      Alert.alert('Success', 'Lead reassigned successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to reassign lead');
    }
  };

  const LeadCard = ({ lead }: { lead: Lead }) => {
    return (
      <View style={styles.leadCard}>
        <View style={styles.leadHeader}>
          <TouchableOpacity onPress={() => toggleLeadSelection(lead.id)} style={{ marginRight: 12 }}>
            <View style={[styles.checkbox, selectedLeads.includes(lead.id) && styles.checkboxActive]}>
              {selectedLeads.includes(lead.id) && <View style={styles.checkboxInner} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push({ pathname: '/(super_admin)/lead-info', params: { id: lead.id } })}>
            <Text style={styles.customerName}>{lead.customer_name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) }]}>
              <Text style={styles.statusText}>{lead.status}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.leadInfo}>
          <View style={styles.infoRow}>
            <Phone size={16} color="#4A5568" />
            <Text style={styles.infoText}>{lead.phone_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color="#4A5568" />
            <Text style={styles.infoText} numberOfLines={2}>{lead.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Calendar size={16} color="#4A5568" />
            <Text style={styles.infoText}>
              {new Date(lead.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reassignButton}
          onPress={() => {
            setSelectedLead(lead);
            setShowReassignmentModal(true);
          }}
        >
          <ArrowRight size={16} color="#FFFFFF" />
          <Text style={styles.reassignButtonText}>Reassign</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: '#3B82F6',
      contacted: '#10B981',
      hold: '#F59E0B',
      transit: '#8B5CF6',
      completed: '#059669',
      declined: '#EF4444',
      ringing: '#FACC15',
    };
    return colors[status as keyof typeof colors] || '#64748B';
  };

  const renderOperatorButtons = () => {
    switch (operatorView) {
      case 'grid':
        return (
          <View style={styles.operatorGrid}>
            {operators.map((operator) => (
              <TouchableOpacity
                key={operator.id}
                style={[
                  styles.operatorButtonGrid,
                  selectedOperator === operator.id && styles.operatorButtonActive
                ]}
                onPress={() => { setSelectedOperator(operator.id); setSelectedLeads([]); }}
              >
                <Users size={28} color={selectedOperator === operator.id ? '#FFFFFF' : '#1E40AF'} />
                <Text style={[
                  styles.operatorButtonText,
                  selectedOperator === operator.id && styles.operatorButtonTextActive
                ]}>
                  {operator.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'list':
        return (
          <View>
            {operators.map((operator) => (
              <TouchableOpacity
                key={operator.id}
                style={[
                  styles.operatorButtonList,
                  selectedOperator === operator.id && styles.operatorButtonActive
                ]}
                onPress={() => { setSelectedOperator(operator.id); setSelectedLeads([]); }}
              >
                <Users size={20} color={selectedOperator === operator.id ? '#FFFFFF' : '#1E40AF'} />
                <Text style={[
                  styles.operatorButtonTextList,
                  selectedOperator === operator.id && styles.operatorButtonTextActive
                ]}>
                  {operator.name}
                </Text>
                <ChevronRight size={20} color={selectedOperator === operator.id ? '#FFFFFF' : '#1E40AF'} style={styles.operatorListIcon} />
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'scroll':
      default:
        return (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {operators.map((operator) => (
              <TouchableOpacity
                key={operator.id}
                style={[
                  styles.operatorButtonScroll,
                  selectedOperator === operator.id && styles.operatorButtonActive
                ]}
                onPress={() => { setSelectedOperator(operator.id); setSelectedLeads([]); }}
              >
                <Users size={20} color={selectedOperator === operator.id ? '#FFFFFF' : '#1E40AF'} />
                <Text style={[
                  styles.operatorButtonText,
                  selectedOperator === operator.id && styles.operatorButtonTextActive
                ]}>
                  {operator.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
    }
  };

  const totalPages = Math.ceil(filteredOperatorLeads.length / pageSize);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <Text style={styles.headerTitle}>Lead Reassignment</Text>
        <Text style={styles.headerSubtitle}>Reassign leads between operators</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.operatorSelector}>
          <View style={styles.operatorHeader}>
            <Text style={styles.sectionTitle}>Select Operator</Text>
            <View style={styles.viewToggleButtons}>
              <TouchableOpacity onPress={() => setOperatorView('grid')} style={[styles.viewToggleButton, operatorView === 'grid' && styles.viewToggleButtonActive]}>
                <LayoutGrid size={20} color={operatorView === 'grid' ? '#FFFFFF' : '#1E40AF'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOperatorView('list')} style={[styles.viewToggleButton, operatorView === 'list' && styles.viewToggleButtonActive]}>
                <List size={20} color={operatorView === 'list' ? '#FFFFFF' : '#1E40AF'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOperatorView('scroll')} style={[styles.viewToggleButton, operatorView === 'scroll' && styles.viewToggleButtonActive]}>
                <Text style={[styles.viewToggleButtonText, operatorView === 'scroll' && styles.viewToggleButtonTextActive]}>Scroll</Text>
              </TouchableOpacity>
            </View>
          </View>
          {renderOperatorButtons()}
        </View>

        {selectedOperator && (
          <View style={styles.leadsSection}>
            <Text style={styles.sectionTitle}>
              Leads for {operators.find(o => o.id === selectedOperator)?.name} ({filteredOperatorLeads.length})
            </Text>
            <TextInput
              style={styles.searchBar}
              placeholder="Search leads by name, phone, or address"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilterContainer}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusButton, filterStatus === status && styles.statusButtonActive]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text style={[styles.statusButtonText, filterStatus === status && styles.statusButtonTextActive]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={toggleSelectAllOnPage} style={styles.selectAllContainer}>
              <View style={[styles.checkbox, allSelectedOnPage && styles.checkboxActive]}>
                {allSelectedOnPage && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.selectAllText}>Select All on Page</Text>
            </TouchableOpacity>

            <View>
              {paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No leads assigned to this operator with the selected filters</Text>
                </View>
              )}
            </View>

            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>
                <Text style={styles.paginationText}>Page {currentPage} of {totalPages}</Text>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
                <Text style={styles.pageSizeLabel}>Page Size:</Text>
                <TextInput
                  style={styles.pageSizeInput}
                  keyboardType="number-pad"
                  value={String(pageSize)}
                  onChangeText={val => {
                    const n = Math.max(1, parseInt(val) || 10);
                    setPageSize(n);
                    setCurrentPage(1);
                  }}
                />
              </View>
            )}
            {selectedLeads.length > 0 && (
              <TouchableOpacity style={styles.bulkReassignButton} onPress={() => setShowReassignmentModal(true)}>
                <ArrowRight size={16} color="#FFFFFF" />
                <Text style={styles.bulkReassignButtonText}>Reassign Selected ({selectedLeads.length})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showReassignmentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReassignmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reassign Lead{selectedLeads.length > 1 ? 's' : ''}</Text>
            <Text style={styles.modalSubtitle}>
              {selectedLeads.length > 1
                ? `Reassign ${selectedLeads.length} selected leads to:`
                : `Reassign "${selectedLead?.customer_name || ''}" to:`}
            </Text>
            
            <ScrollView style={styles.operatorList}>
              {operators.filter(op => op.id !== (selectedLead?.call_operator_id || selectedOperator)).map((operator) => (
                <TouchableOpacity
                  key={operator.id}
                  style={[
                    styles.operatorOption,
                    targetOperatorId === operator.id && styles.operatorOptionSelected
                  ]}
                  onPress={() => setTargetOperatorId(operator.id)}
                >
                  <Users size={20} color={targetOperatorId === operator.id ? '#FFFFFF' : '#1E40AF'} />
                  <View style={styles.operatorInfo}>
                    <Text style={[
                      styles.operatorName,
                      targetOperatorId === operator.id && styles.operatorNameSelected
                    ]}>
                      {operator.name}
                    </Text>
                    <Text style={[
                      styles.operatorEmail,
                      targetOperatorId === operator.id && styles.operatorEmailSelected
                    ]}>
                      {operator.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReassignmentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, !targetOperatorId && styles.confirmButtonDisabled]}
                onPress={selectedLeads.length > 1 ? handleBulkReassign : handleReassignLead}
                disabled={!targetOperatorId}
              >
                <Text style={styles.confirmButtonText}>Reassign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#E2E8F0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  operatorSelector: {
    marginBottom: 20,
  },
  operatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  viewToggleButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  viewToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#1E40AF',
  },
  viewToggleButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  viewToggleButtonTextActive: {
    color: '#FFFFFF',
  },
  operatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  operatorButtonGrid: {
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - 60) / 3,
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  operatorButtonList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  operatorListIcon: {
    marginLeft: 'auto',
  },
  operatorButtonScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  operatorButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  operatorButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    marginLeft: 8,
  },
  operatorButtonTextList: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
  },
  operatorButtonTextActive: {
    color: '#FFFFFF',
  },
  leadsSection: {
    flex: 1,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusFilterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusButtonText: {
    color: '#64748B',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  selectAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#1E40AF',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  selectAllText: {
    color: '#1E40AF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  leadsList: {
    flex: 1,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  leadInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4A5568',
    flex: 1,
    marginLeft: 12,
  },
  reassignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  reassignButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  paginationButton: {
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#FFF',
    fontFamily: 'Inter-Medium',
  },
  paginationText: {
    color: '#1E40AF',
    marginHorizontal: 8,
    fontFamily: 'Inter-Medium',
  },
  pageSizeLabel: {
    marginLeft: 16,
    color: '#1E40AF',
    fontFamily: 'Inter-Medium',
  },
  pageSizeInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    width: 50,
    marginLeft: 8,
    padding: 8,
    textAlign: 'center',
    color: '#1E40AF',
    fontFamily: 'Inter-Regular',
  },
  bulkReassignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  bulkReassignButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: 350,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center',
  },
  operatorList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  operatorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  operatorOptionSelected: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  operatorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  operatorName: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  operatorNameSelected: {
    color: '#FFFFFF',
  },
  operatorEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  operatorEmailSelected: {
    color: '#E2E8F0',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
