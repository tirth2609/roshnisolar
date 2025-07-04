import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  ArrowRight,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  User,
  LogOut,
  BarChart3,
  Settings,
  Plus,
  Filter,
  Search,
  TrendingUp,
  Clock,
  Target,
  Building,
  DollarSign,
  FileText,
  Zap,
  CreditCard,
  CalendarDays,
  ArrowUpRight,
  Award,
  UserPlus,
  LayoutDashboard,
  Wrench,
  ChevronRight,
  GitMerge,
  FileCheck,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Lead } from '@/types/leads';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export default function TeamLeadDashboard() {
  const { user, signOut } = useAuth();
  const { 
    leads, 
    getAllUsers, 
    getSalesmen, 
    getCallOperators, 
    getLeadsBySalesman, 
    bulkAssignLeadsToCallOperator, 
    reassignLeadFromOperator,
    getTransitLeads,
    isLoading, 
    refreshData 
  } = useData();
  const router = useRouter();
  
  const [selectedSalesman, setSelectedSalesman] = useState<string>('');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetOperatorId, setTargetOperatorId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [assignMode, setAssignMode] = useState<'assign' | 'reassign'>('assign');
  const [workDataFilter, setWorkDataFilter] = useState<'today' | '7days' | '30days'>('today');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadPage, setLeadPage] = useState(1);
  const [leadsPerPage] = useState(10);
  const [operatorPage, setOperatorPage] = useState(1);
  const [operatorsPerPage] = useState(5);
  const [transitPage, setTransitPage] = useState(1);
  const [transitPerPage] = useState(3);

  // Get all users and filter by role
  const allUsers = getAllUsers();
  const salesmen = allUsers.filter(u => u.role === 'salesman' && u.is_active);
  const operators = allUsers.filter(u => u.role === 'call_operator' && u.is_active);
  
  // Get transit leads for team lead
  const transitLeads = getTransitLeads();
  
  // Get leads for selected salesman based on mode
  const salesmanLeads = selectedSalesman 
    ? leads.filter(lead => {
        if (assignMode === 'assign') {
          // For assign mode: show only unassigned leads
          return lead.salesman_id === selectedSalesman && !lead.call_operator_id;
        } else {
          // For reassign mode: show all leads from this salesman that are assigned to call operators
          return lead.salesman_id === selectedSalesman && lead.call_operator_id;
        }
      })
    : [];

  // Filter and paginate leads for assignment
  const filteredSalesmanLeads = salesmanLeads.filter(lead =>
    lead.customer_name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
    lead.phone_number?.includes(leadSearch) ||
    lead.address?.toLowerCase().includes(leadSearch)
  );
  const paginatedSalesmanLeads = filteredSalesmanLeads.slice((leadPage-1)*leadsPerPage, leadPage*leadsPerPage);
  const totalLeadPages = Math.ceil(filteredSalesmanLeads.length / leadsPerPage);

  // Paginate operators
  const paginatedOperators = operators.slice((operatorPage-1)*operatorsPerPage, operatorPage*operatorsPerPage);
  const totalOperatorPages = Math.ceil(operators.length / operatorsPerPage);

  // Paginate transit leads
  const paginatedTransitLeads = transitLeads.slice((transitPage-1)*transitPerPage, transitPage*transitPerPage);
  const totalTransitPages = Math.ceil(transitLeads.length / transitPerPage);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleBulkAssign = async () => {
    if (!targetOperatorId || selectedLeads.length === 0) {
      Alert.alert('Error', 'Please select leads and an operator');
      return;
    }
    
    try {
      await bulkAssignLeadsToCallOperator(selectedLeads, targetOperatorId);
      setShowAssignModal(false);
      setSelectedLeads([]);
      setTargetOperatorId('');
      Alert.alert('Success', `${selectedLeads.length} leads assigned successfully!`);
    } catch (error) {
      console.error('Error assigning leads:', error);
      Alert.alert('Error', 'Failed to assign leads. Please try again.');
    }
  };

  const handleBulkReassign = async () => {
    if (!targetOperatorId || selectedLeads.length === 0) {
      Alert.alert('Error', 'Please select leads and an operator');
      return;
    }
    
    try {
      // For reassignment, we need to handle each lead individually
      const reassignPromises = selectedLeads.map(async (leadId) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        
        // If lead is already assigned to a call operator, use reassignLeadFromOperator
        if (lead.call_operator_id && lead.call_operator_id !== targetOperatorId) {
          return reassignLeadFromOperator(leadId, lead.call_operator_id, targetOperatorId);
        } else {
          // If no current operator or same operator, just assign normally
          return bulkAssignLeadsToCallOperator([leadId], targetOperatorId);
        }
      });
      
      await Promise.all(reassignPromises);
      setShowReassignModal(false);
      setSelectedLeads([]);
      setTargetOperatorId('');
      Alert.alert('Success', `${selectedLeads.length} leads reassigned successfully!`);
    } catch (error) {
      console.error('Error reassigning leads:', error);
      Alert.alert('Error', 'Failed to reassign leads. Please try again.');
    }
  };

  const getAnalytics = () => {
    const totalLeads = leads.length;
    const unassignedLeads = leads.filter(l => !l.call_operator_id).length;
    const assignedLeads = totalLeads - unassignedLeads;
    const completedLeads = leads.filter(l => l.status === 'completed').length;
    const conversionRate = totalLeads > 0 ? ((completedLeads / totalLeads) * 100).toFixed(1) : '0';

    // Get leads by status
    const leadsByStatus = {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      transit: leads.filter(l => l.status === 'transit').length,
      completed: completedLeads,
      declined: leads.filter(l => l.status === 'declined').length,
      hold: leads.filter(l => l.status === 'hold').length,
    };

    // Get leads by likelihood
    const leadsByLikelihood = {
      hot: leads.filter(l => l.likelihood === 'hot').length,
      warm: leads.filter(l => l.likelihood === 'warm').length,
      cold: leads.filter(l => l.likelihood === 'cold').length,
    };

    // Get top performing salesmen
    const salesmanPerformance = salesmen.map(salesman => {
      const salesmanLeads = leads.filter(l => l.salesman_id === salesman.id);
      const completedLeads = salesmanLeads.filter(l => l.status === 'completed').length;
      const conversionRate = salesmanLeads.length > 0 ? ((completedLeads / salesmanLeads.length) * 100).toFixed(1) : '0';
      return {
        id: salesman.id,
        name: salesman.name,
        totalLeads: salesmanLeads.length,
        completedLeads,
        conversionRate,
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);

    // Get top performing operators
    const operatorPerformance = operators.map(operator => {
      const operatorLeads = leads.filter(l => l.call_operator_id === operator.id);
      const completedLeads = operatorLeads.filter(l => l.status === 'completed').length;
      const conversionRate = operatorLeads.length > 0 ? ((completedLeads / operatorLeads.length) * 100).toFixed(1) : '0';
      return {
        id: operator.id,
        name: operator.name,
        totalLeads: operatorLeads.length,
        completedLeads,
        conversionRate,
      };
    }).sort((a, b) => b.totalLeads - a.totalLeads);

    // Get monthly trends
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
    }).length;

    const lastMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthLeads = leads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return leadDate.getMonth() === lastMonth.getMonth() && leadDate.getFullYear() === lastMonth.getFullYear();
    }).length;

    const monthlyGrowth = lastMonthLeads > 0 ? (((monthlyLeads - lastMonthLeads) / lastMonthLeads) * 100).toFixed(1) : '0';

    return {
      totalLeads,
      unassignedLeads,
      assignedLeads,
      completedLeads,
      conversionRate,
      leadsByStatus,
      leadsByLikelihood,
      salesmanPerformance: salesmanPerformance.slice(0, 5), // Top 5
      operatorPerformance: operatorPerformance.slice(0, 5), // Top 5
      monthlyLeads,
      monthlyGrowth,
      salesmenCount: salesmen.length,
      operatorsCount: operators.length,
    };
  };

  const analytics = getAnalytics();

  const TransitLeadCard = ({ lead }: { lead: Lead }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <Text style={styles.leadName}>{lead.customer_name}</Text>
        <View style={styles.leadStatus}>
          <Text style={styles.statusText}>Transit</Text>
        </View>
      </View>
      
      <View style={styles.leadDetails}>
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
            <User size={16} color="#64748B" />
            <Text style={styles.leadDetailText}>Operator: {lead.call_operator_name}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const OperatorCard = ({ operator }: { operator: any }) => {
    const opLeads = leads.filter(lead => lead.call_operator_id === operator.id);
    const completedLeads = opLeads.filter(l => l.status === 'completed').length;
    const activeLeads = opLeads.filter(l => l.status !== 'completed' && l.status !== 'declined').length;
    
    return (
      <View style={styles.operatorCard}>
        <View style={styles.operatorHeader}>
          <Text style={styles.operatorName}>{operator.name}</Text>
          <View style={styles.operatorStatus}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.operatorStatusText}>Active</Text>
          </View>
        </View>
        <View style={styles.operatorStats}>
          <View style={styles.operatorStat}>
            <Text style={styles.operatorStatNumber}>{opLeads.length}</Text>
            <Text style={styles.operatorStatLabel}>Total</Text>
          </View>
          <View style={styles.operatorStat}>
            <Text style={styles.operatorStatNumber}>{activeLeads}</Text>
            <Text style={styles.operatorStatLabel}>Active</Text>
          </View>
          <View style={styles.operatorStat}>
            <Text style={styles.operatorStatNumber}>{completedLeads}</Text>
            <Text style={styles.operatorStatLabel}>Completed</Text>
          </View>
        </View>
      </View>
    );
  };

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <TouchableOpacity
      style={[
        styles.leadCard,
        selectedLeads.includes(lead.id) && styles.leadCardSelected
      ]}
      onPress={() => {
        setSelectedLeads((prev) =>
          prev.includes(lead.id) ? prev.filter(id => id !== lead.id) : [...prev, lead.id]
        );
      }}
    >
      <View style={styles.leadHeader}>
        <Text style={styles.leadName}>{lead.customer_name}</Text>
        <View style={styles.leadStatus}>
          <Text style={styles.statusText}>{lead.status}</Text>
        </View>
      </View>
      
      <View style={styles.leadDetails}>
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
      </View>
      
      {selectedLeads.includes(lead.id) && (
        <View style={styles.selectedIndicator}>
          <CheckCircle size={16} color="#10B981" />
        </View>
      )}
    </TouchableOpacity>
  );

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'hot': return '#EF4444';
      case 'warm': return '#F59E0B';
      case 'cold': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  // --- Analytics Card Components (from analytics.tsx) ---
  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}> 
        <Icon size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
  const PerformanceCard = ({ title, data, type }: any) => (
    <View style={styles.performanceCard}>
      <Text style={styles.performanceTitle}>{title}</Text>
      {data.length === 0 ? (
        <Text style={styles.emptyText}>No data available</Text>
      ) : (
        data.map((item: any, index: number) => (
          <View key={item.id} style={styles.performanceItem}>
            <View style={styles.performanceRank}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.performanceInfo}>
              <Text style={styles.performanceName}>{item.name}</Text>
              <Text style={styles.performanceStats}>
                {item.totalLeads} leads • {item.completedLeads} completed • {item.conversionRate}% conversion
              </Text>
            </View>
          </View>
        ))
      )}
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
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      {/* Blue Gradient Header */}
      <LinearGradient colors={['#2563EB', '#60A5FA']} style={{ paddingTop: 48, paddingBottom: 32, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Welcome back,</Text>
        <Text style={{ color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Team Lead Manager</Text>
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600', marginBottom: 24 }}>Team Lead Dashboard</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold' }}>{analytics.leadsByStatus.transit}</Text>
            <Text style={{ color: '#E0E7EF', fontSize: 14 }}>Transit Leads</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold' }}>{analytics.completedLeads}</Text>
            <Text style={{ color: '#E0E7EF', fontSize: 14 }}>Completed</Text>
          </View>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#FFF', fontSize: 28, fontWeight: 'bold' }}>{analytics.conversionRate}%</Text>
            <Text style={{ color: '#E0E7EF', fontSize: 14 }}>Conversion</Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard icon={Target} title="Total Leads" value={analytics.totalLeads} color="#1E40AF" />
            <StatCard icon={Clock} title="Unassigned" value={analytics.unassignedLeads} color="#F59E0B" />
            <StatCard icon={Users} title="Assigned" value={analytics.assignedLeads} color="#10B981" />
            <StatCard icon={CheckCircle} title="Completed" value={analytics.completedLeads} color="#8B5CF6" />
          </View>
        </View>
        {/* Conversion & Growth */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Performance</Text>
          <View style={styles.statsGrid}>
            <StatCard icon={TrendingUp} title="Conversion Rate" value={`${analytics.conversionRate}%`} color="#10B981" />
            <StatCard icon={Calendar} title="This Month" value={analytics.monthlyLeads} subtitle={`${analytics.monthlyGrowth}% vs last month`} color="#8B5CF6" />
          </View>
        </View>
        {/* Leads by Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Leads by Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.statusLabel}>New</Text>
              <Text style={styles.statusCount}>{analytics.leadsByStatus.new}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statusLabel}>Contacted</Text>
              <Text style={styles.statusCount}>{analytics.leadsByStatus.contacted}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.statusLabel}>Transit</Text>
              <Text style={styles.statusCount}>{analytics.leadsByStatus.transit}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusLabel}>Completed</Text>
              <Text style={styles.statusCount}>{analytics.leadsByStatus.completed}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.statusLabel}>Declined</Text>
              <Text style={styles.statusCount}>{analytics.leadsByStatus.declined}</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#6B7280' }]} />
              <Text style={styles.statusLabel}>Hold</Text>
              <Text style={styles.statusCount}>{analytics.leadsByStatus.hold}</Text>
            </View>
          </View>
        </View>
        {/* Leads by Likelihood */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔥 Leads by Likelihood</Text>
          <View style={styles.likelihoodGrid}>
            <View style={styles.likelihoodItem}>
              <View style={[styles.likelihoodBadge, { backgroundColor: '#FEE2E2' }]}> 
                <Text style={[styles.likelihoodText, { color: '#EF4444' }]}>HOT</Text>
              </View>
              <Text style={styles.likelihoodCount}>{analytics.leadsByLikelihood.hot}</Text>
            </View>
            <View style={styles.likelihoodItem}>
              <View style={[styles.likelihoodBadge, { backgroundColor: '#FEF3C7' }]}> 
                <Text style={[styles.likelihoodText, { color: '#F59E0B' }]}>WARM</Text>
              </View>
              <Text style={styles.likelihoodCount}>{analytics.leadsByLikelihood.warm}</Text>
            </View>
            <View style={styles.likelihoodItem}>
              <View style={[styles.likelihoodBadge, { backgroundColor: '#DBEAFE' }]}> 
                <Text style={[styles.likelihoodText, { color: '#3B82F6' }]}>COLD</Text>
              </View>
              <Text style={styles.likelihoodCount}>{analytics.leadsByLikelihood.cold}</Text>
            </View>
          </View>
        </View>
        {/* Top Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Performers</Text>
          <View style={styles.performanceGrid}>
            <PerformanceCard title="Top Salesmen" data={analytics.salesmanPerformance} type="salesman" />
            <PerformanceCard title="Top Call Operators" data={analytics.operatorPerformance} type="operator" />
          </View>
        </View>
        {/* Quick Actions */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 12 }}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(team_lead)/lead-assign')}
          >
            <UserPlus size={24} color="#3B82F6" />
            <Text style={styles.quickActionLabel}>Assign Leads</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(team_lead)/transit-leads')}
          >
            <GitMerge size={24} color="#8B5CF6" />
            <Text style={styles.quickActionLabel}>Transit Leads</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(team_lead)/customer-conversion')}
          >
            <FileCheck size={24} color="#10B981" />
            <Text style={styles.quickActionLabel}>Conversions</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(team_lead)/profile')}
          >
            <Settings size={24} color="#64748B" />
            <Text style={styles.quickActionLabel}>Settings</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        {/* Transit Leads Preview */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B' }}>Transit Leads Preview</Text>
          <TouchableOpacity onPress={() => router.push('/(team_lead)/transit-leads')}>
            <Text style={{ color: '#64748B', fontSize: 14 }}>View All ({transitLeads.length})</Text>
          </TouchableOpacity>
        </View>
        {paginatedTransitLeads.length > 0 ? paginatedTransitLeads.map((lead) => (
          <View key={lead.id} style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 16 }}>{lead.customer_name} <Text style={{ color: '#64748B', fontSize: 12, fontWeight: 'normal' }}>Transit</Text></Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Phone size={16} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={{ color: '#64748B', fontSize: 14, marginRight: 12 }}>{lead.phone_number}</Text>
                <MapPin size={16} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={{ color: '#64748B', fontSize: 14, marginRight: 12 }}>{lead.address}</Text>
                <Building size={16} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={{ color: '#64748B', fontSize: 14, marginRight: 12 }}>{lead.property_type}</Text>
                {lead.call_operator_name && <><User size={16} color="#64748B" style={{ marginRight: 4 }} /><Text style={{ color: '#64748B', fontSize: 14 }}>Operator: {lead.call_operator_name}</Text></>}
              </View>
            </View>
          </View>
        )) : (
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <Text style={{ color: '#64748B', fontSize: 16 }}>No transit leads available</Text>
          </View>
        )}
        {totalTransitPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, transitPage === 1 && styles.paginationDisabled]}
              disabled={transitPage === 1}
              onPress={() => setTransitPage(transitPage - 1)}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Page {transitPage} of {totalTransitPages}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, transitPage === totalTransitPages && styles.paginationDisabled]}
              disabled={transitPage === totalTransitPages}
              onPress={() => setTransitPage(transitPage + 1)}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Call Operator Performance */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginTop: 24, marginBottom: 12 }}>Call Operator Performance</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {paginatedOperators.map((operator) => (
            <TouchableOpacity 
              key={operator.id} 
              onPress={() => router.push({ pathname: '/(team_lead)/operator-overview', params: { operatorId: operator.id } })}
            >
              <OperatorCard operator={operator} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Pagination for operators if needed */}
        {totalOperatorPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, operatorPage === 1 && styles.paginationDisabled]}
              disabled={operatorPage === 1}
              onPress={() => setOperatorPage(operatorPage - 1)}
            >
              <Text style={styles.paginationButtonText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Page {operatorPage} of {totalOperatorPages}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, operatorPage === totalOperatorPages && styles.paginationDisabled]}
              disabled={operatorPage === totalOperatorPages}
              onPress={() => setOperatorPage(operatorPage + 1)}
            >
              <Text style={styles.paginationButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
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
    justifyContent: 'space-between' as const,
  },
  welcomeSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
    marginLeft: 8,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  filterTabs: {
    flexDirection: 'row' as const,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#1E40AF',
  },
  filterTabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
  },
  picker: {
    width: '100%' as any,
  },
  leadsList: {
    maxHeight: 250,
  },
  leadCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
  },
  leadHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
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
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
  },
  operatorCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 120,
  },
  operatorHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  operatorName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  operatorStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  operatorStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  operatorStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  operatorStat: {
    alignItems: 'center' as const,
  },
  operatorStatNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  operatorStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: 350,
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
    maxHeight: 200,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  modalInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
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
    marginTop: 24,
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
    backgroundColor: '#1E40AF',
    alignItems: 'center' as const,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
    textAlign: 'center' as const,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center' as const,
  },
  quickActions: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  quickActionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'right' as const,
  },
  selectedIndicator: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 4,
  },
  leadCardSelected: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  statCard: {
    alignItems: 'center' as const,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94A3B8',
  },
  performanceGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  performanceCard: {
    flex: 1,
  },
  performanceTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center' as const,
  },
  performanceItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
    marginRight: 8,
  },
  performanceInfo: {
    flex: 1,
  },
  performanceName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  performanceStats: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  performanceRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 8,
  },
  statusGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    flex: 1,
  },
  statusCount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
  likelihoodGrid: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  likelihoodItem: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center' as const,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  likelihoodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  likelihoodText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  likelihoodCount: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
  },
  quickActionsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  quickActionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
  },
  paginationContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginVertical: 8,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginHorizontal: 4,
  },
  paginationButtonText: {
    color: '#FFF',
    fontWeight: 'bold' as const,
  },
  paginationDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  paginationText: {
    color: '#1F2937',
    fontWeight: '600' as '600',
    marginHorizontal: 8,
  },
}; 