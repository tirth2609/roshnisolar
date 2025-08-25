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
  Dimensions,
  TextInput,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  Phone,
  ArrowRight,
  UserPlus,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Calendar,
  MapPin,
  Mail,
  List,
  Grid,
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead } from '@/types/leads';
import SkeletonLeadList from '../components/SkeletonLeadList';
import { FadeInView, SlideInView } from '@/components/AnimatedComponents';

const { width } = Dimensions.get('window');

const BULK_OPTIONS = [5, 10, 15, 20, 25, 50, 100];
const DISABLED_COLOR = '#CBD5E1';
const GRADIENT_COLORS = ['#DC2626', '#EF4444'];

const getScreenSize = (currentWidth: number) => {
  if (currentWidth > 1200) return 'xl';
  if (currentWidth > 900) return 'lg';
  if (currentWidth > 600) return 'md';
  return 'sm';
};

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
    refreshData,
  } = useData();
  const { theme } = useTheme();

  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [selectedBulkSize, setSelectedBulkSize] = useState<number>(10);
  const [customBulkSizeInput, setCustomBulkSizeInput] = useState('');
  const [showBulkAssignmentModal, setShowBulkAssignmentModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unassigned' | 'unassigned_call_ops' | 'unassigned_techs' | 'assigned' | 'declined'>('unassigned');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOperator, setExpandedOperator] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [currentOperatorPage, setCurrentOperatorPage] = useState<{ [key: string]: number }>({});
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const OPERATOR_PAGE_SIZE = 10;
  const screenSize = getScreenSize(width);

  const users = getAllUsers();
  const unassignedLeads = getUnassignedLeads();
  const unassignedToCallOps = getUnassignedToCallOperators();
  const unassignedToTechs = getUnassignedToTechnicians();

  if (!user || (user.role !== 'super_admin' && user.role !== 'team_lead')) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <AlertTriangle size={48} color={theme.error} />
        <Text style={[styles.errorText, { color: theme.error, marginTop: 16 }]}>Access denied. Only administrators and team leads can assign leads.</Text>
      </View>
    );
  }

  const getFilteredLeads = () => {
    let filteredLeads = leads;

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

    if (searchQuery.trim()) {
      filteredLeads = filteredLeads.filter(lead =>
        lead.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone_number.includes(searchQuery) ||
        lead.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const applyCustomBulkSize = () => {
    const size = parseInt(customBulkSizeInput, 10);
    if (!isNaN(size) && size > 0) {
      setSelectedBulkSize(size);
      Alert.alert('Success', `Bulk size set to ${size}.`);
      setCustomBulkSizeInput('');
    } else {
      Alert.alert('Invalid Input', 'Please enter a valid positive number for bulk size.');
    }
  };

  const handleBulkAssignment = async () => {
    if (!selectedOperator) {
      Alert.alert('Error', 'Please select an operator.');
      return;
    }

    let availableLeads = [];
    if (selectedOperator.role === 'call_operator') {
      availableLeads = getUnassignedToCallOperators().slice(0, selectedBulkSize);
    } else if (selectedOperator.role === 'technician') {
      availableLeads = getUnassignedToTechnicians().slice(0, selectedBulkSize);
    } else {
      availableLeads = getUnassignedLeads().slice(0, selectedBulkSize);
    }

    if (availableLeads.length === 0) {
      Alert.alert('No Leads', 'No unassigned leads available to assign.');
      setShowBulkAssignmentModal(false);
      return;
    }

    try {
      const leadIds = availableLeads.map(lead => lead.id);
      console.log(`Attempting to bulk assign ${leadIds.length} lead IDs to ${selectedOperator.name}:`, leadIds);

      if (selectedOperator.role === 'call_operator') {
        await bulkAssignLeadsToCallOperator(leadIds, selectedOperator.id);
      } else if (selectedOperator.role === 'technician') {
        await bulkAssignLeadsToTechnician(leadIds, selectedOperator.id);
      }

      setShowBulkAssignmentModal(false);
      setSelectedOperator(null);
      setCustomBulkSizeInput('');
      Alert.alert('Success', `${availableLeads.length} leads assigned to ${selectedOperator.name}!`);
    } catch (error: any) {
      console.error('Bulk assignment failed:', error);
      Alert.alert('Error', `Failed to assign leads: ${error.message || 'Unknown error'}. Check console for details.`);
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
    const color = getStatusColor(status);
    switch (status) {
      case 'new': return <Clock size={16} color={color} />;
      case 'contacted': return <Phone size={16} color={color} />;
      case 'transit': return <ArrowRight size={16} color={color} />;
      case 'completed': return <CheckCircle size={16} color={color} />;
      case 'declined': return <X size={16} color={color} />;
      case 'hold': return <AlertTriangle size={16} color={color} />;
      default: return <Clock size={16} color={color} />;
    }
  };

  const OperatorCard = ({ operator }: { operator: any }) => {
    const assignedLeads = getLeadsByUser(operator.id, operator.role);
    const isExpanded = expandedOperator === operator.id;
    const page = currentOperatorPage[operator.id] || 1;
    const totalPages = Math.ceil(assignedLeads.length / OPERATOR_PAGE_SIZE);
    const paginatedLeads = assignedLeads.slice((page - 1) * OPERATOR_PAGE_SIZE, page * OPERATOR_PAGE_SIZE);

    return (
      <View style={[styles.operatorCard, { backgroundColor: theme.background }]}>
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
            <Text style={[styles.operatorName, { color: theme.text }]}>{operator.name}</Text>
            <Text style={[styles.operatorRole, { color: theme.primary }]}>{operator.role.replace('_', ' ').toUpperCase()}</Text>
            <Text style={[styles.operatorEmail, { color: theme.textSecondary }]}>{operator.email}</Text>
          </View>
          <View style={styles.operatorStats}>
            <Text style={[styles.operatorLeadCount, { color: theme.text }]}>{assignedLeads.length}</Text>
            <Text style={[styles.operatorLeadLabel, { color: theme.textSecondary }]}>Leads</Text>
            {isExpanded ? <ChevronUp size={20} color={theme.textSecondary} /> : <ChevronDown size={20} color={theme.textSecondary} />}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.operatorLeads}>
            {assignedLeads.length === 0 ? (
              <Text style={[styles.noLeadsText, { color: theme.textTertiary }]}>No leads assigned</Text>
            ) : (
              <>
                {paginatedLeads.map((lead) => (
                  <View key={lead.id} style={[styles.assignedLeadItem, { backgroundColor: theme.background }]}>
                    <View style={styles.assignedLeadInfo}>
                      <Text style={[styles.leadName, { color: theme.text }]}>{lead.customer_name}</Text>
                      <Text style={[styles.leadPhone, { color: theme.textSecondary }]}>{lead.phone_number}</Text>
                      <View style={styles.statusContainer}>
                        {getStatusIcon(lead.status)}
                        <Text style={[styles.statusText, { color: getStatusColor(lead.status) }]}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                {totalPages > 1 && (
                  <View style={[styles.paginationContainer, { marginVertical: 8 }]}>
                    <TouchableOpacity
                      onPress={() => setCurrentOperatorPage(prev => ({ ...prev, [operator.id]: page - 1 }))}
                      disabled={page === 1}
                      style={[styles.paginationButton, { backgroundColor: page === 1 ? DISABLED_COLOR : theme.primary }]}
                    >
                      <Text style={styles.paginationButtonText}>Previous</Text>
                    </TouchableOpacity>
                    <Text style={[styles.paginationText, { color: theme.text }]}>Page {page} of {totalPages}</Text>
                    <TouchableOpacity
                      onPress={() => setCurrentOperatorPage(prev => ({ ...prev, [operator.id]: page + 1 }))}
                      disabled={page === totalPages}
                      style={[styles.paginationButton, { backgroundColor: page === totalPages ? DISABLED_COLOR : theme.primary }]}
                    >
                      <Text style={styles.paginationButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.assignButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setSelectedOperator(operator);
            setShowBulkAssignmentModal(true);
            setCustomBulkSizeInput('');
          }}
        >
          <UserPlus size={16} color={theme.textInverse} />
          <Text style={[styles.assignButtonText, { color: theme.textInverse }]}>Assign Leads</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <View style={[styles.leadCard, { backgroundColor: theme.background }]}>
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={[styles.customerName, { color: theme.text }]}>{lead.customer_name}</Text>
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
          <Phone size={14} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>{lead.phone_number}</Text>
        </View>

        <View style={styles.detailRow}>
          <MapPin size={14} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={2}>{lead.address}</Text>
        </View>

        {lead.email && (
          <View style={styles.detailRow}>
            <Mail size={14} color={theme.textSecondary} />
            <Text style={[styles.detailText, { color: theme.textSecondary }]}>{lead.email}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Calendar size={14} color={theme.textSecondary} />
          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
            {new Date(lead.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {(lead.call_operator_name || lead.technician_name) && (
        <View style={[styles.assignmentInfo, { backgroundColor: theme.backgroundSecondary, borderColor: theme.info }]}>
          <Text style={[styles.assignmentLabel, { color: theme.textSecondary }]}>Currently Assigned:</Text>
          {lead.call_operator_name && (
            <Text style={[styles.assignmentText, { color: theme.text }]}>📞 {lead.call_operator_name}</Text>
          )}
          {lead.technician_name && (
            <Text style={[styles.assignmentText, { color: theme.text }]}>🔧 {lead.technician_name}</Text>
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
    setCurrentPage(1);
  }, [filterType, searchQuery, pageSize]);

  const callOperators = getUsersByRole('call_operator');
  const technicians = getUsersByRole('technician');

  const operatorGridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  };

  const operatorCardWidth = (): ViewStyle['width'] => {
    if (viewMode === 'list') {
      return '100%';
    }
    const currentScreenSize = getScreenSize(width);
    if (currentScreenSize === 'xl') {
      return '31%';
    }
    if (currentScreenSize === 'lg') {
      return '48%';
    }
    return '100%';
  };

  const leadsToAssignCount = selectedOperator?.role === 'call_operator'
    ? Math.min(selectedBulkSize, unassignedToCallOps.length)
    : selectedOperator?.role === 'technician'
      ? Math.min(selectedBulkSize, unassignedToTechs.length)
      : 0;

  const totalUnassignedLeads = selectedOperator?.role === 'call_operator'
    ? unassignedToCallOps.length
    : selectedOperator?.role === 'technician'
      ? unassignedToTechs.length
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient colors={GRADIENT_COLORS} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textInverse }]}>Lead Assignment</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textInverse }]}>Operator to Leads Management</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.scrollViewContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor={theme.primary} colors={[theme.primary]} />
        }
      >
        <View style={styles.contentInnerContainer}>
          <View style={styles.spacer} />
          {/* Stats Cards */}
          <FadeInView duration={600}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.statNumber, { color: theme.primary }]}>{unassignedLeads.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Unassigned</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.statNumber, { color: theme.info }]}>
                  {leads.filter(l => l.call_operator_id || l.technician_id).length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Assigned</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.background }]}>
                <Text style={[styles.statNumber, { color: theme.success }]}>{callOperators.length + technicians.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Operators</Text>
              </View>
            </View>
          </FadeInView>
          <View style={styles.spacer} />
          {/* Operators Section */}
          <SlideInView direction="up" delay={200} duration={600}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Operators ({callOperators.length + technicians.length})</Text>
              <TouchableOpacity onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                {viewMode === 'list' ? <Grid size={24} color={theme.textSecondary} /> : <List size={24} color={theme.textSecondary} />}
              </TouchableOpacity>
            </View>
            {callOperators.length + technicians.length === 0 ? (
              <View style={styles.emptyState}>
                <Users size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No operators found</Text>
              </View>
            ) : (
              <View style={viewMode === 'grid' ? operatorGridStyle : {}}>
                {callOperators.map((operator) => (
                  <View key={operator.id} style={{ width: operatorCardWidth() }}>
                    <OperatorCard operator={operator} />
                  </View>
                ))}
                {technicians.map((operator) => (
                  <View key={operator.id} style={{ width: operatorCardWidth() }}>
                    <OperatorCard operator={operator} />
                  </View>
                ))}
              </View>
            )}
          </SlideInView>
          <View style={styles.spacer} />
          {/* Leads List */}
          <SlideInView direction="up" delay={600} duration={600}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Leads ({filteredLeads.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'all' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[styles.filterButtonText, filterType === 'all' && { color: theme.textInverse }]}>All ({leads.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'unassigned' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setFilterType('unassigned')}
              >
                <Text style={[styles.filterButtonText, filterType === 'unassigned' && { color: theme.textInverse }]}>Unassigned ({unassignedLeads.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'unassigned_call_ops' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setFilterType('unassigned_call_ops')}
              >
                <Text style={[styles.filterButtonText, filterType === 'unassigned_call_ops' && { color: theme.textInverse }]}>Unassigned Ops ({unassignedToCallOps.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'unassigned_techs' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setFilterType('unassigned_techs')}
              >
                <Text style={[styles.filterButtonText, filterType === 'unassigned_techs' && { color: theme.textInverse }]}>Unassigned Techs ({unassignedToTechs.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'assigned' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setFilterType('assigned')}
              >
                <Text style={[styles.filterButtonText, filterType === 'assigned' && { color: theme.textInverse }]}>Assigned ({leads.filter(l => l.call_operator_id || l.technician_id).length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'declined' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setFilterType('declined')}
              >
                <Text style={[styles.filterButtonText, filterType === 'declined' && { color: theme.textInverse }]}>Declined ({leads.filter(l => l.status === 'declined').length})</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={styles.leadListContainer}>
              {paginatedLeads.length === 0 ? (
                <View style={styles.emptyState}>
                  <Users size={48} color={theme.textTertiary} />
                  <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No leads found</Text>
                  <Text style={[styles.emptyStateSubtext, { color: theme.textTertiary }]}>
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
            {totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={[styles.paginationButton, { backgroundColor: currentPage === 1 ? DISABLED_COLOR : theme.primary }]}
                >
                  <Text style={styles.paginationButtonText}>Previous</Text>
                </TouchableOpacity>
                <Text style={[styles.paginationText, { color: theme.text }]}>Page {currentPage} of {totalPages}</Text>
                <TouchableOpacity
                  onPress={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={[styles.paginationButton, { backgroundColor: currentPage === totalPages ? DISABLED_COLOR : theme.primary }]}
                >
                  <Text style={styles.paginationButtonText}>Next</Text>
                </TouchableOpacity>
                <View style={styles.pageSizeContainer}>
                  <Text style={[styles.pageSizeLabel, { color: theme.text }]}>Size:</Text>
                  <TextInput
                    style={[styles.pageSizeInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    value={pageSize.toString()}
                    onChangeText={text => {
                      const size = parseInt(text, 10);
                      if (!isNaN(size) && size > 0) setPageSize(size);
                    }}
                  />
                </View>
              </View>
            )}
          </SlideInView>
          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Bulk Assignment Modal */}
      <Modal
        visible={showBulkAssignmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBulkAssignmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Bulk Assign Leads</Text>
            {selectedOperator && (
              <View style={[styles.selectedOperatorInfo, { backgroundColor: theme.backgroundSecondary }]}>
                <Text style={[styles.selectedOperatorName, { color: theme.text }]}>{selectedOperator.name}</Text>
                <Text style={[styles.selectedOperatorRole, { color: theme.primary }]}>{selectedOperator.role.replace('_', ' ').toUpperCase()}</Text>
                <Text style={[styles.selectedOperatorEmail, { color: theme.textSecondary }]}>{selectedOperator.email}</Text>
              </View>
            )}
            <View style={styles.bulkSizeSelection}>
              <Text style={[styles.bulkSizeLabel, { color: theme.text }]}>Select number of leads to assign:</Text>
              <View style={styles.bulkSizeButtons}>
                {BULK_OPTIONS.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.bulkSizeButton,
                      { backgroundColor: selectedBulkSize === size && customBulkSizeInput === '' ? theme.primary : theme.backgroundSecondary },
                      { borderColor: selectedBulkSize === size && customBulkSizeInput === '' ? theme.primary : theme.border },
                    ]}
                    onPress={() => {
                      setSelectedBulkSize(size);
                      setCustomBulkSizeInput('');
                    }}
                  >
                    <Text style={[styles.bulkSizeButtonText, { color: selectedBulkSize === size && customBulkSizeInput === '' ? theme.textInverse : theme.text }]}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.bulkSizeLabel, { color: theme.text, marginTop: 16 }]}>Or enter a custom number:</Text>
              <View style={styles.customBulkSizeInputContainer}>
                <TextInput
                  style={[styles.customBulkSizeInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                  keyboardType="numeric"
                  placeholder="Custom leads..."
                  value={customBulkSizeInput}
                  onChangeText={(text) => {
                    setCustomBulkSizeInput(text);
                    const size = parseInt(text, 10);
                    if (!isNaN(size) && size > 0) {
                      setSelectedBulkSize(size);
                    }
                  }}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>
            <View style={[styles.bulkInfo, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.bulkInfoText, { color: theme.primary }]}>
                Will assign {leadsToAssignCount} unassigned leads to {selectedOperator?.name}
              </Text>
              <Text style={[styles.bulkInfoSubtext, { color: theme.primary }]}>
                Available unassigned leads for this role: {totalUnassignedLeads}
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  setShowBulkAssignmentModal(false);
                  setSelectedOperator(null);
                  setCustomBulkSizeInput('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.primary, opacity: !selectedOperator || leadsToAssignCount === 0 ? 0.7 : 1 }]}
                onPress={handleBulkAssignment}
                disabled={!selectedOperator || leadsToAssignCount === 0}
              >
                <Text style={[styles.confirmButtonText, { color: theme.textInverse }]}>
                  Assign {leadsToAssignCount} Leads
                </Text>
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
  },
  contentScroll: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingBottom: 24,
  },
  contentInnerContainer: {
    paddingHorizontal: 20,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  spacer: {
    height: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  filterContainer: {
    marginBottom: 16,
    paddingBottom: 8,
    gap: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  operatorCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  operatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  operatorRole: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  operatorEmail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  operatorStats: {
    alignItems: 'flex-end',
  },
  operatorLeadCount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  operatorLeadLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  operatorLeads: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  noLeadsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  assignedLeadItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  assignedLeadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  leadPhone: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  assignButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  leadCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 18,
    fontFamily: 'Inter-Bold',
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
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flex: 1,
  },
  assignmentInfo: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  assignmentLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  assignmentText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  leadListContainer: {},
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
    flexWrap: 'wrap',
  },
  paginationButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  paginationText: {
    fontFamily: 'Inter-SemiBold',
  },
  pageSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  pageSizeLabel: {
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  pageSizeInput: {
    width: 60,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectedOperatorInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedOperatorName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  selectedOperatorRole: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  selectedOperatorEmail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  bulkSizeSelection: {
    marginBottom: 16,
  },
  bulkSizeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  bulkSizeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bulkSizeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 55,
    alignItems: 'center',
  },
  bulkSizeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  customBulkSizeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  customBulkSizeInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  setCustomBulkSizeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setCustomBulkSizeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  bulkInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  bulkInfoText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  bulkInfoSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginTop: 20,
  },
});
