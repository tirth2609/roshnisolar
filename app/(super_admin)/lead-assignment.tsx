import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  Phone, 
  ArrowRight, 
  UserPlus, 
  UserCheck,
  Filter,
  Search,
  Calendar,
  MapPin,
  Mail,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead } from '@/types/leads';
import SkeletonLeadList from '../components/SkeletonLeadList';

const { width } = Dimensions.get('window');

const BULK_OPTIONS = [5, 10, 15, 20, 25, 50, 100];

export default function LeadAssignmentScreen() {
  const { user } = useAuth();
  const { 
    leads, 
    getAllUsers, 
    bulkAssignLeadsToCallOperator,
    bulkAssignLeadsToTechnician,
    getUnassignedLeads,
    getUnassignedToCallOperators,
    getUnassignedToTechnicians,
    isLoading, 
    refreshData 
  } = useData();
  const { theme } = useTheme();
  
  // Move all hooks to the top before any return
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [selectedBulkSize, setSelectedBulkSize] = useState<number>(10);
  const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'unassigned_call_ops' | 'unassigned_techs' | 'assigned' | 'declined'>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOperator, setExpandedOperator] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [currentOperatorPage, setCurrentOperatorPage] = useState<{ [key: string]: number }>({});
  const OPERATOR_PAGE_SIZE = 10;

  // All data fetching here
  const users = getAllUsers();
  const unassignedLeads = getUnassignedLeads();
  const unassignedToCallOps = getUnassignedToCallOperators();
  const unassignedToTechs = getUnassignedToTechnicians();

  // Only allow admins and team leads to access this screen
  if (!user || (user.role !== 'super_admin' && user.role !== 'team_lead')) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Access denied. Only administrators can assign leads.</Text>
      </View>
    );
  }
  
  const getFilteredLeads = () => {
    let filteredLeads = leads;

    // Apply filter
    switch (filterType) {
      case 'unassigned':
        filteredLeads = unassignedLeads;
        break;
      case 'unassigned_call_ops':
        filteredLeads = unassignedToCallOps;
        break;
      case 'unassigned_techs':
        filteredLeads = unassignedToTechs;
        break;
      case 'assigned':
        filteredLeads = leads.filter(lead => 
          lead.call_operator_id || lead.technician_id
        );
        break;
      case 'declined':
        filteredLeads = leads.filter(lead => lead.status === 'declined');
        break;
      default:
        filteredLeads = leads;
    }

    // Apply search
    if (searchQuery.trim()) {
      filteredLeads = filteredLeads.filter(lead =>
        lead.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone_number.includes(searchQuery) ||
        lead.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredLeads;
  };

  const getUsersByRole = (role: string) => {
    return users.filter(u => u.role === role && u.is_active);
  };

  const getLeadsByUser = (userId: string, userRole: string) => {
    switch (userRole) {
      case 'call_operator':
        return leads.filter(lead => lead.call_operator_id === userId);
      case 'technician':
        return leads.filter(lead => lead.technician_id === userId);
      default:
        return [];
    }
  };

  const handleBulkAssignment = async () => {
    if (!selectedOperator) {
      Alert.alert('Error', 'Please select an operator');
      return;
    }

    const availableLeads = unassignedLeads.slice(0, selectedBulkSize);
    
    if (availableLeads.length === 0) {
      Alert.alert('Error', 'No unassigned leads available');
      return;
    }

    try {
      const leadIds = availableLeads.map(lead => lead.id);
      
      if (selectedOperator.role === 'call_operator') {
        await bulkAssignLeadsToCallOperator(leadIds, selectedOperator.id);
      } else if (selectedOperator.role === 'technician') {
        await bulkAssignLeadsToTechnician(leadIds, selectedOperator.id);
      }
      
      setShowBulkAssignmentModal(false);
      setSelectedOperator(null);
      Alert.alert('Success', `${availableLeads.length} leads assigned to ${selectedOperator.name}!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to assign leads');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#3B82F6';
      case 'contacted': return '#F59E0B';
      case 'transit': return '#8B5CF6';
      case 'completed': return '#10B981';
      case 'declined': return '#EF4444';
      case 'hold': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock size={16} color="#3B82F6" />;
      case 'contacted': return <Phone size={16} color="#F59E0B" />;
      case 'transit': return <ArrowRight size={16} color="#8B5CF6" />;
      case 'completed': return <CheckCircle size={16} color="#10B981" />;
      case 'declined': return <X size={16} color="#EF4444" />;
      case 'hold': return <AlertTriangle size={16} color="#6B7280" />;
      default: return <Clock size={16} color="#6B7280" />;
    }
  };

  const OperatorCard = ({ operator }: { operator: any }) => {
    const assignedLeads = getLeadsByUser(operator.id, operator.role);
    const isExpanded = expandedOperator === operator.id;
    const page = currentOperatorPage[operator.id] || 1;
    const totalPages = Math.ceil(assignedLeads.length / OPERATOR_PAGE_SIZE);
    const paginatedLeads = assignedLeads.slice((page - 1) * OPERATOR_PAGE_SIZE, page * OPERATOR_PAGE_SIZE);

    return (
      <View style={styles.operatorCard}>
        <TouchableOpacity
          style={styles.operatorHeader}
          onPress={() => {
            setExpandedOperator(isExpanded ? null : operator.id);
            if (!currentOperatorPage[operator.id]) {
              setCurrentOperatorPage(prev => ({ ...prev, [operator.id]: 1 }));
            }
          }}
        >
          <View style={styles.operatorInfo}>
            <Text style={styles.operatorName}>{operator.name}</Text>
            <Text style={styles.operatorRole}>{operator.role.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.operatorEmail}>{operator.email}</Text>
          </View>
          <View style={styles.operatorStats}>
            <Text style={styles.operatorLeadCount}>{assignedLeads.length}</Text>
            <Text style={styles.operatorLeadLabel}>Leads</Text>
            {isExpanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.operatorLeads}>
            {assignedLeads.length === 0 ? (
              <Text style={styles.noLeadsText}>No leads assigned</Text>
            ) : (
              <>
                {paginatedLeads.map((lead) => (
                  <View key={lead.id} style={styles.assignedLeadItem}>
                    <View style={styles.assignedLeadInfo}>
                      <Text style={styles.leadName}>{lead.customer_name}</Text>
                      <Text style={styles.leadPhone}>{lead.phone_number}</Text>
                      <View style={styles.statusContainer}>
                        {getStatusIcon(lead.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                {/* Pagination Controls for Operator Leads */}
                {totalPages > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 8, gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => setCurrentOperatorPage(prev => ({ ...prev, [operator.id]: page - 1 }))}
                      disabled={page === 1}
                    >
                      <Text>Previous</Text>
                    </TouchableOpacity>
                    <Text>Page {page} of {totalPages}</Text>
                    <TouchableOpacity
                      onPress={() => setCurrentOperatorPage(prev => ({ ...prev, [operator.id]: page + 1 }))}
                      disabled={page === totalPages}
                    >
                      <Text>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.assignButton}
          onPress={() => {
            setSelectedOperator(operator);
            setShowBulkAssignmentModal(true);
          }}
        >
          <UserPlus size={16} color="#FFFFFF" />
          <Text style={styles.assignButtonText}>Assign Leads</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={styles.customerName}>{lead.customer_name}</Text>
          <View style={styles.statusContainer}>
            {getStatusIcon(lead.status)}
            <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.leadDetails}>
        <View style={styles.detailRow}>
          <Phone size={14} color="#6B7280" />
          <Text style={styles.detailText}>{lead.phone_number}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={2}>{lead.address}</Text>
        </View>

        {lead.email && (
          <View style={styles.detailRow}>
            <Mail size={14} color="#6B7280" />
            <Text style={styles.detailText}>{lead.email}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {new Date(lead.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Assignment Info */}
      {(lead.call_operator_name || lead.technician_name) && (
        <View style={styles.assignmentInfo}>
          <Text style={styles.assignmentLabel}>Currently Assigned:</Text>
          {lead.call_operator_name && (
            <Text style={styles.assignmentText}>📞 {lead.call_operator_name}</Text>
          )}
          {lead.technician_name && (
            <Text style={styles.assignmentText}>🔧 {lead.technician_name}</Text>
          )}
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return <SkeletonLeadList count={4} />;
  }

  const filteredLeads = getFilteredLeads();
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page if filters/search change
  }, [filterType, searchQuery, pageSize]);

  const callOperators = getUsersByRole('call_operator');
  const technicians = getUsersByRole('technician');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#DC2626', '#EF4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Lead Assignment</Text>
            <Text style={styles.headerSubtitle}>Operator to Leads Management</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} />}
      >
        {/* Stats Cards */}
        <View style={styles.section}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{unassignedLeads.length}</Text>
              <Text style={styles.statLabel}>Unassigned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {leads.filter(l => l.call_operator_id || l.technician_id).length}
              </Text>
              <Text style={styles.statLabel}>Assigned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{callOperators.length + technicians.length}</Text>
              <Text style={styles.statLabel}>Operators</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
                  onPress={() => setFilterType('all')}
                >
                  <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
                    All ({leads.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === 'unassigned' && styles.filterButtonActive]}
                  onPress={() => setFilterType('unassigned')}
                >
                  <Text style={[styles.filterButtonText, filterType === 'unassigned' && styles.filterButtonTextActive]}>
                    Unassigned ({unassignedLeads.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === 'unassigned_call_ops' && styles.filterButtonActive]}
                  onPress={() => setFilterType('unassigned_call_ops')}
                >
                  <Text style={[styles.filterButtonText, filterType === 'unassigned_call_ops' && styles.filterButtonTextActive]}>
                    Unassigned Call Operators ({unassignedToCallOps.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === 'unassigned_techs' && styles.filterButtonActive]}
                  onPress={() => setFilterType('unassigned_techs')}
                >
                  <Text style={[styles.filterButtonText, filterType === 'unassigned_techs' && styles.filterButtonTextActive]}>
                    Unassigned Technicians ({unassignedToTechs.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === 'assigned' && styles.filterButtonActive]}
                  onPress={() => setFilterType('assigned')}
                >
                  <Text style={[styles.filterButtonText, filterType === 'assigned' && styles.filterButtonTextActive]}>
                    Assigned ({leads.filter(l => l.call_operator_id || l.technician_id).length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, filterType === 'declined' && styles.filterButtonActive]}
                  onPress={() => setFilterType('declined')}
                >
                  <Text style={[styles.filterButtonText, filterType === 'declined' && styles.filterButtonTextActive]}>
                    Declined ({leads.filter(l => l.status === 'declined').length})
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Operators Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call Operators ({callOperators.length})</Text>
          {callOperators.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No call operators found</Text>
            </View>
          ) : (
            callOperators.map((operator) => (
              <OperatorCard key={operator.id} operator={operator} />
            ))
          )}
        </View>

        {/* Technicians Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technicians ({technicians.length})</Text>
          {technicians.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No technicians found</Text>
            </View>
          ) : (
            technicians.map((operator) => (
              <OperatorCard key={operator.id} operator={operator} />
            ))
          )}
        </View>

        {/* Leads List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leads ({filteredLeads.length})</Text>
          {filteredLeads.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No leads found</Text>
              <Text style={styles.emptyStateSubtext}>
                {filterType === 'unassigned' ? 'All leads have been assigned' : 'No leads match your criteria'}
              </Text>
            </View>
          ) : (
            paginatedLeads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))
          )}
        </View>

        {/* Pagination Controls */}
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
            onChangeText={text => {
              const size = parseInt(text, 10);
              if (!isNaN(size) && size > 0) setPageSize(size);
            }}
          />
        </View>
      </ScrollView>

      {/* Bulk Assignment Modal */}
      <Modal
        visible={showBulkAssignmentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBulkAssignmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bulk Assign Leads</Text>
            
            {selectedOperator && (
              <View style={styles.selectedOperatorInfo}>
                <Text style={styles.selectedOperatorName}>{selectedOperator.name}</Text>
                <Text style={styles.selectedOperatorRole}>{selectedOperator.role.replace('_', ' ').toUpperCase()}</Text>
                <Text style={styles.selectedOperatorEmail}>{selectedOperator.email}</Text>
              </View>
            )}

            <View style={styles.bulkSizeSelection}>
              <Text style={styles.bulkSizeLabel}>Select number of leads to assign:</Text>
              <View style={styles.bulkSizeButtons}>
                {BULK_OPTIONS.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[styles.bulkSizeButton, selectedBulkSize === size && styles.bulkSizeButtonActive]}
                    onPress={() => setSelectedBulkSize(size)}
                  >
                    <Text style={[styles.bulkSizeButtonText, selectedBulkSize === size && styles.bulkSizeButtonTextActive]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.bulkInfo}>
              <Text style={styles.bulkInfoText}>
                Will assign {Math.min(selectedBulkSize, unassignedLeads.length)} unassigned leads to {selectedOperator?.name}
              </Text>
              <Text style={styles.bulkInfoSubtext}>
                Available unassigned leads: {unassignedLeads.length}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowBulkAssignmentModal(false);
                  setSelectedOperator(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, !selectedOperator && styles.confirmButtonDisabled]}
                onPress={handleBulkAssignment}
                disabled={!selectedOperator}
              >
                <Text style={styles.confirmButtonText}>Assign {Math.min(selectedBulkSize, unassignedLeads.length)} Leads</Text>
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FECACA',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#DC2626',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  operatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  operatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  operatorRole: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 2,
  },
  operatorEmail: {
    fontSize: 12,
    color: '#6B7280',
  },
  operatorStats: {
    alignItems: 'center',
  },
  operatorLeadCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  operatorLeadLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  operatorLeads: {
    marginBottom: 12,
  },
  noLeadsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  assignedLeadItem: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  assignedLeadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  leadPhone: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  assignButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  leadDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  assignmentInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  assignmentLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  assignmentText: {
    fontSize: 14,
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width - 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectedOperatorInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedOperatorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  selectedOperatorRole: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
    marginTop: 2,
  },
  selectedOperatorEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  bulkSizeSelection: {
    marginBottom: 16,
  },
  bulkSizeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  bulkSizeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bulkSizeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    minWidth: 50,
    alignItems: 'center',
  },
  bulkSizeButtonActive: {
    backgroundColor: '#DC2626',
  },
  bulkSizeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  bulkSizeButtonTextActive: {
    color: '#FFFFFF',
  },
  bulkInfo: {
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bulkInfoText: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  bulkInfoSubtext: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 20,
  },
}); 