import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Calendar, 
  MapPin, 
  Phone, 
  Clock, 
  TrendingUp, 
  Filter,
  CheckCircle,
  XCircle,
  Pause,
  User,
  Building,
  Zap,
  Wrench,
  Target,
  Award,
  Bell,
  Menu,
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead, LeadStatus } from '@/types/leads';
import { router } from 'expo-router';
import SkeletonLeadList from '../components/SkeletonLeadList';
import { 
  FadeInView, 
  SlideInView, 
  ScaleInView, 
  AnimatedCard, 
  AnimatedProgressBar,
  PulseView,
} from '@/components/AnimatedComponents';

const { width: screenWidth } = Dimensions.get('window');

const statusColors = {
  new: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  contacted: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  hold: { bg: '#E5E7EB', text: '#374151', border: '#6B7280' },
  transit: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  declined: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
  completed: { bg: '#DCFCE7', text: '#166534', border: '#22C55E' },
};

const likelihoodColors = {
  hot: '#EF4444',
  warm: '#F97316',
  cold: '#64748B',
};

export default function TechnicianVisitsScreen() {
  const { user } = useAuth();
  const { getUserLeads, updateLeadStatus, isLoading, refreshData } = useData();
  const { theme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all'>('transit');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [visitNotes, setVisitNotes] = useState('');
  const [newStatus, setNewStatus] = useState<LeadStatus>('completed');
  const [reminderDate, setReminderDate] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const myLeads = user ? getUserLeads(user.id) : [];
  const filteredLeads = selectedStatus === 'all' 
    ? myLeads 
    : myLeads.filter(lead => lead.status === selectedStatus);

  const getStatusCounts = () => {
    const counts = {
      total: myLeads.length,
      transit: myLeads.filter(l => l.status === 'transit').length,
      completed: myLeads.filter(l => l.status === 'completed').length,
      hold: myLeads.filter(l => l.status === 'hold').length,
    };
    return counts;
  };

  const counts = getStatusCounts();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedLead) return;

    try {
      await updateLeadStatus(selectedLead.id, newStatus, visitNotes);
      setShowStatusModal(false);
      setVisitNotes('');
      setSelectedLead(null);
      Alert.alert('Success', 'Visit status updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update visit status');
    }
  };

  const handleSetReminder = () => {
    // Implementation of handleSetReminder function
  };

  const getGradientColors = () => {
    return ['#059669', '#10B981', '#34D399'] as const;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'transit':
        return theme.primary;
      case 'completed':
        return theme.success;
      case 'hold':
        return theme.warning;
      case 'declined':
        return theme.error;
      default:
        return theme.primary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'transit':
        return <Clock size={16} color={theme.primary} />;
      case 'completed':
        return <CheckCircle size={16} color={theme.success} />;
      case 'hold':
        return <Pause size={16} color={theme.warning} />;
      case 'declined':
        return <XCircle size={16} color={theme.error} />;
      default:
        return <Bell size={16} color={theme.primary} />;
    }
  };

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood) {
      case 'hot':
        return '#EF4444';
      case 'warm':
        return '#F97316';
      case 'cold':
        return '#64748B';
      default:
        return '#64748B';
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  if (isLoading) {
    return <SkeletonLeadList count={4} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <LinearGradient colors={getGradientColors()} style={styles.header}>
        <FadeInView duration={600}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View style={styles.welcomeSection}>
                <Text style={[styles.welcomeText, { color: theme.textInverse }]}>
                  Welcome back,
                </Text>
                <Text style={[styles.userName, { color: theme.textInverse }]}>
                  {user?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                onPress={() => router.push('/profile')}
              >
                <Menu size={20} color={theme.textInverse} />
              </TouchableOpacity>
            </View>
            
            <SlideInView delay={200} duration={600} direction="up">
              <Text style={[styles.headerSubtitle, { color: theme.textInverse }]}>
                Manage your site visits and installations
              </Text>
            </SlideInView>
          </View>
        </FadeInView>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <FadeInView delay={400} duration={600}>
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Overview</Text>
            <View style={styles.statsGrid}>
              <AnimatedCard index={0} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: theme.primaryLight }]}>
                  <Target size={20} color={theme.textInverse} />
                </View>
                <Text style={[styles.statNumber, { color: theme.text }]}>{counts.total}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Visits</Text>
                <AnimatedProgressBar 
                  progress={counts.total / Math.max(counts.total, 1)} 
                  height={4}
                  color={theme.primary}
                  backgroundColor={theme.border}
                  style={styles.statProgress}
                />
              </AnimatedCard>
              
              <AnimatedCard index={1} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: theme.success }]}>
                  <Wrench size={20} color={theme.textInverse} />
                </View>
                <Text style={[styles.statNumber, { color: theme.text }]}>{counts.transit}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>In Progress</Text>
                <AnimatedProgressBar 
                  progress={counts.transit / Math.max(counts.total, 1)} 
                  height={4}
                  color={theme.success}
                  backgroundColor={theme.border}
                  style={styles.statProgress}
                />
              </AnimatedCard>
            </View>
          </View>
        </FadeInView>

        {/* Performance Metrics */}
        <SlideInView delay={600} duration={600} direction="up">
          <View style={styles.metricsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              <AnimatedCard index={2} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Award size={20} color={theme.primary} />
                  <Text style={[styles.metricTitle, { color: theme.text }]}>Completion Rate</Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {counts.total > 0 
                    ? ((counts.completed / counts.total) * 100).toFixed(1)
                    : '0'}%
                </Text>
                <Text style={[styles.metricSubtitle, { color: theme.textSecondary }]}>
                  {counts.completed} of {counts.total} visits
                </Text>
              </AnimatedCard>
              
              <AnimatedCard index={3} style={styles.metricCard}>
                <View style={styles.metricHeader}>
                  <Clock size={20} color={theme.warning} />
                  <Text style={[styles.metricTitle, { color: theme.text }]}>Avg Duration</Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.text }]}>
                  {counts.total > 0 ? '2.5h' : '0h'}
                </Text>
                <Text style={[styles.metricSubtitle, { color: theme.textSecondary }]}>
                  Per installation
                </Text>
              </AnimatedCard>
            </View>
          </View>
        </SlideInView>

        {/* Filter Tabs */}
        <SlideInView delay={800} duration={600} direction="up">
          <View style={styles.filterContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Visits</Text>
            <View style={styles.filterTabs}>
              {[
                { key: 'all', label: 'All', count: counts.total },
                { key: 'transit', label: 'In Progress', count: counts.transit },
                { key: 'completed', label: 'Completed', count: counts.completed },
                { key: 'hold', label: 'On Hold', count: counts.hold },
              ].map((filter, index) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterTab,
                    selectedStatus === filter.key && { 
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                    { borderColor: theme.border }
                  ]}
                  onPress={() => setSelectedStatus(filter.key as LeadStatus | 'all')}
                >
                  <Text style={[
                    styles.filterTabText,
                    { 
                      color: selectedStatus === filter.key 
                        ? theme.textInverse 
                        : theme.textSecondary 
                    }
                  ]}>
                    {filter.label}
                  </Text>
                  <View style={[
                    styles.filterCount,
                    { 
                      backgroundColor: selectedStatus === filter.key 
                        ? theme.textInverse 
                        : theme.border 
                    }
                  ]}>
                    <Text style={[
                      styles.filterCountText,
                      { 
                        color: selectedStatus === filter.key 
                          ? theme.primary 
                          : theme.textSecondary 
                      }
                    ]}>
                      {filter.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SlideInView>

        {/* Leads List */}
        <SlideInView delay={1000} duration={600} direction="up">
          <View style={styles.leadsContainer}>
            {filteredLeads.map((lead, index) => (
              <AnimatedCard 
                key={lead.id} 
                index={index}
                style={[styles.leadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.leadHeader}>
                  <View style={styles.leadInfo}>
                    <Text style={[styles.leadName, { color: theme.text }]}>{lead.customer_name || 'N/A'}</Text>
                    <Text style={[styles.leadPhone, { color: theme.textSecondary }]}>{lead.phone_number || 'N/A'}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(lead.status) }
                  ]}>
                    {getStatusIcon(lead.status)}
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(lead.status) }
                    ]}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.leadDetails}>
                  <Text style={[styles.leadAddress, { color: theme.textSecondary }]}>
                    {lead.address || 'N/A'}
                  </Text>
                  <Text style={[styles.leadDate, { color: theme.textSecondary }]}>
                    Assigned: {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>

                {lead.call_notes && (
                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>Call Notes:</Text>
                    <Text style={[styles.notesText, { color: theme.text }]}>{lead.call_notes}</Text>
                  </View>
                )}

                {lead.visit_notes && (
                  <View style={styles.notesContainer}>
                    <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>Visit Notes:</Text>
                    <Text style={[styles.notesText, { color: theme.text }]}>{lead.visit_notes}</Text>
                  </View>
                )}
                
                <View style={styles.leadActions}>
                  {lead.status === 'transit' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.success }]}
                      onPress={() => {
                        setSelectedLead(lead);
                        setShowStatusModal(true);
                      }}
                    >
                      <CheckCircle size={16} color={theme.textInverse} />
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        Update Visit
                      </Text>
                    </TouchableOpacity>
                  )}

                  {lead.status === 'hold' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.warning }]}
                      onPress={() => {
                        setSelectedLead(lead);
                        setShowReminderModal(true);
                      }}
                    >
                      <Clock size={16} color={theme.textInverse} />
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        Set Reminder
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </AnimatedCard>
            ))}
            
            {filteredLeads.length === 0 && (
              <FadeInView delay={1200} duration={600}>
                <View style={styles.emptyState}>
                  <PulseView>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.border }]}>
                      <Wrench size={40} color={theme.textSecondary} />
                    </View>
                  </PulseView>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No visits found
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                    {selectedStatus === 'all' 
                      ? 'You don\'t have any visits assigned yet.'
                      : `No ${selectedStatus} visits at the moment.`
                    }
                  </Text>
                </View>
              </FadeInView>
            )}
          </View>
        </SlideInView>
      </ScrollView>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Visit Status</Text>
            
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[styles.statusOption, newStatus === 'completed' && styles.statusOptionSelected]}
                onPress={() => setNewStatus('completed')}
              >
                <CheckCircle size={20} color={newStatus === 'completed' ? '#FFFFFF' : '#10B981'} />
                <Text style={[styles.statusOptionText, newStatus === 'completed' && styles.statusOptionTextSelected]}>
                  Completed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, newStatus === 'hold' && styles.statusOptionSelected]}
                onPress={() => setNewStatus('hold')}
              >
                <Pause size={20} color={newStatus === 'hold' ? '#FFFFFF' : '#F59E0B'} />
                <Text style={[styles.statusOptionText, newStatus === 'hold' && styles.statusOptionTextSelected]}>
                  On Hold
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, newStatus === 'declined' && styles.statusOptionSelected]}
                onPress={() => setNewStatus('declined')}
              >
                <XCircle size={20} color={newStatus === 'declined' ? '#FFFFFF' : '#EF4444'} />
                <Text style={[styles.statusOptionText, newStatus === 'declined' && styles.statusOptionTextSelected]}>
                  Declined
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Add visit notes..."
              value={visitNotes}
              onChangeText={setVisitNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#64748B"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleStatusUpdate}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
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
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  statProgress: {
    width: '100%',
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 6,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  filterTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  filterTabText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  filterCountText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  leadsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  leadCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
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
  leadName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  leadPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  leadDetails: {
    marginBottom: 12,
  },
  leadAddress: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  leadDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  notesContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
    paddingLeft: 8,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingVertical: 4,
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  leadActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusOptions: {
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  statusOptionSelected: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  statusOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E293B',
    marginLeft: 12,
  },
  statusOptionTextSelected: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});