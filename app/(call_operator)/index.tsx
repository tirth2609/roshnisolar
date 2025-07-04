import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Platform,
  Modal,
  TextInput,
  Image,
  Animated,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Phone, 
  List, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Filter,
  PhoneCall,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  ArrowRight,
  CalendarDays,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  Bell,
  Menu,
  Search,
  History,
  RotateCcw,
  User,
  Building,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Lead, LeadStatus, CallLaterLog } from '@/types/leads';
import { CallLog } from '@/types/logs';
import { PredefinedMessage, MESSAGE_CATEGORIES } from '@/types/messages';
import { supabase } from '@/lib/supabase';
import SkeletonLeadList from '../components/SkeletonLeadList';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { 
  FadeInView, 
  SlideInView, 
  ScaleInView, 
  AnimatedCard, 
  AnimatedProgressBar,
  PulseView,
} from '@/components/AnimatedComponents';
import { Picker } from '@react-native-picker/picker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive scaling functions
const scale = (size: number) => {
  const baseWidth = 375; // iPhone base width
  const scaleFactor = screenWidth / baseWidth;
  return Math.round(size * Math.min(scaleFactor, 1.5)); // Cap scaling at 1.5x
};

const verticalScale = (size: number) => {
  const baseHeight = 812; // iPhone base height
  const scaleFactor = screenHeight / baseHeight;
  return Math.round(size * Math.min(scaleFactor, 1.5)); // Cap scaling at 1.5x
};

const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const statusColors = {
  new: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  ringing: { bg: '#F0EFFF', text: '#7C3AED', border: '#8B5CF6' },
  contacted: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  hold: { bg: '#F3F4F6', text: '#374151', border: '#6B7280' },
  transit: { bg: '#F3E8FF', text: '#7C3AED', border: '#8B5CF6' },
  declined: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
  completed: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
};

const likelihoodColors = {
  hot: '#EF4444',
  warm: '#F59E0B',
  cold: '#3B82F6',
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(40),
    paddingHorizontal: moderateScale(20),
    minHeight: verticalScale(200), // Ensure minimum height for UHD screens
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  welcomeSection: {
    flex: 1,
    minHeight: verticalScale(60), // Ensure minimum height
  },
  welcomeText: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Regular',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(20),
  },
  userName: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-Bold',
    lineHeight: moderateScale(28),
    minHeight: verticalScale(28), // Ensure minimum height
  },
  menuButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40, // Minimum touch target
    minHeight: 40,
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    opacity: 0.9,
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(12),
  },
  searchContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(4),
    minHeight: verticalScale(60), // Ensure minimum height for search
  },
  searchInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    fontSize: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: moderateScale(8),
    minHeight: verticalScale(44), // Minimum touch target for input
    lineHeight: moderateScale(20),
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: moderateScale(20),
    marginBottom: verticalScale(24),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Inter-Bold',
    marginBottom: verticalScale(16),
    lineHeight: moderateScale(22),
  },
  statsGrid: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  statCard: {
    flex: 1,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: verticalScale(120), // Ensure minimum height
  },
  statIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    minWidth: 40,
    minHeight: 40,
  },
  statNumber: {
    fontSize: moderateScale(24),
    fontFamily: 'Inter-Bold',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(28),
  },
  statLabel: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(16),
  },
  statProgress: {
    width: '100%',
  },
  metricsContainer: {
    paddingHorizontal: moderateScale(20),
    marginBottom: verticalScale(24),
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  metricCard: {
    flex: 1,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: verticalScale(100),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  metricTitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    marginLeft: moderateScale(8),
    lineHeight: moderateScale(18),
  },
  metricValue: {
    fontSize: moderateScale(20),
    fontFamily: 'Inter-Bold',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(24),
  },
  metricSubtitle: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },
  filterContainer: {
    paddingHorizontal: moderateScale(20),
    marginBottom: verticalScale(24),
  },
  filterTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  filterTab: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: verticalScale(36), // Minimum touch target
  },
  filterTabText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
    lineHeight: moderateScale(16),
  },
  filterCount: {
    paddingHorizontal: moderateScale(6),
    paddingVertical: verticalScale(2),
    borderRadius: moderateScale(10),
    marginLeft: moderateScale(6),
    minWidth: moderateScale(20),
    minHeight: verticalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: moderateScale(10),
    fontFamily: 'Inter-Bold',
    lineHeight: moderateScale(12),
  },
  leadsContainer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: verticalScale(40),
  },
  leadCard: {
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: verticalScale(120),
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(12),
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(20),
  },
  leadPhone: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    lineHeight: moderateScale(18),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    minHeight: verticalScale(24),
  },
  statusText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
    lineHeight: moderateScale(16),
  },
  leadDetails: {
    marginBottom: verticalScale(12),
  },
  leadAddress: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(18),
  },
  leadDate: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Regular',
    lineHeight: moderateScale(16),
  },
  leadActions: {
    flexDirection: 'column',
    gap: verticalScale(8),
  },
  actionRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(10),
    minHeight: verticalScale(44), // Minimum touch target
  },
  actionButtonText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: moderateScale(6),
    lineHeight: moderateScale(18),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyIcon: {
    width: moderateScale(64),
    height: moderateScale(64),
    marginBottom: verticalScale(16),
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Inter-Bold',
    marginBottom: moderateScale(8),
    lineHeight: moderateScale(22),
  },
  emptySubtitle: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: moderateScale(18),
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
  modalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E293B',
    marginBottom: 8,
  },
  dropdownContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalActions: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  technicianList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  technicianOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  technicianDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 2,
  },
  technicianSpecialization: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  call_later_count: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 4,
  },
  historyContainer: {
    flex: 1,
    padding: 16,
  },
  historyItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  historyOperator: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  historyReason: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  historyNotes: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  historyTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    marginRight: moderateScale(8),
    minHeight: verticalScale(44),
  },
  searchIcon: {
    marginRight: moderateScale(8),
  },
  clearSearchButton: {
    marginLeft: moderateScale(8),
  },
  searchButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(24),
    width: '100%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: verticalScale(16),
    minHeight: verticalScale(44),
  },
  datePickerButtonText: {
    color: '#1E293B',
    fontSize: moderateScale(16),
    fontFamily: 'Inter-Medium',
    marginLeft: moderateScale(8),
    lineHeight: moderateScale(20),
  },
  additional_phone: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: moderateScale(18),
  },
  messageOption: {
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    backgroundColor: '#F8FAFC',
    minHeight: verticalScale(80),
  },
  messageTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(20),
  },
  messageContent: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: verticalScale(8),
    lineHeight: moderateScale(18),
  },
  messageCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
    minHeight: verticalScale(24),
  },
  categoryText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
    lineHeight: moderateScale(16),
  },
  searchResultsContainer: {
    maxHeight: verticalScale(300),
    marginBottom: verticalScale(20),
  },
  searchResultItem: {
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
    backgroundColor: '#F8FAFC',
    minHeight: verticalScale(80),
  },
  searchResultName: {
    fontSize: moderateScale(16),
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: verticalScale(4),
    lineHeight: moderateScale(20),
  },
  searchResultPhone: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: moderateScale(18),
  },
  searchResultAddress: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: moderateScale(18),
  },
  noResultsText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: verticalScale(20),
    lineHeight: moderateScale(18),
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(16),
    paddingHorizontal: moderateScale(20),
    gap: moderateScale(12),
  },
  paginationButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  paginationButtonDisabled: {
    backgroundColor: theme.border,
    opacity: 0.6,
  },
  paginationText: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-SemiBold',
    color: theme.text,
  },
  pageSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  pageSizeLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Medium',
    color: theme.textSecondary,
  },
  pageSizeInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    fontSize: moderateScale(14),
    fontFamily: 'Inter-Regular',
    color: theme.text,
    width: moderateScale(60),
    textAlign: 'center',
  },
});

export default function CallOperatorDashboard() {
  const { user } = useAuth();
  const { 
    getUserLeads, 
    updateLeadStatus, 
    updateLeadStatusWithCallLater,
    assignLeadToTechnician, 
    rescheduleLead, 
    scheduleCall, 
    getScheduledCallsForToday, 
    getTechnicians, 
    getCallLaterLogs,
    searchLeadsByPhone,
    logCall,
    getCallLogs,
    getPredefinedMessages,
    isLoading, 
    refreshData 
  } = useData();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  
  // Basic state
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all' | 'today'>('new');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Status update modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>('contacted');
  const [statusNotes, setStatusNotes] = useState('');
  
  // Call later functionality
  const [showCallLaterModal, setShowCallLaterModal] = useState(false);
  const [selectedLeadForCallLater, setSelectedLeadForCallLater] = useState<Lead | null>(null);
  const [callLaterDate, setCallLaterDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [callLaterReason, setCallLaterReason] = useState('');
  const [callLaterNotes, setCallLaterNotes] = useState('');
  const [showCallLaterDatePicker, setShowCallLaterDatePicker] = useState(false);
  const [callLaterTime, setCallLaterTime] = useState(new Date());
  const [showCallLaterTimePicker, setShowCallLaterTimePicker] = useState(false);
  
  // Call later history
  const [showCallLaterHistoryModal, setShowCallLaterHistoryModal] = useState(false);
  const [callLaterLogs, setCallLaterLogs] = useState<CallLaterLog[]>([]);
  
  // Call history
  const [showCallHistoryModal, setShowCallHistoryModal] = useState(false);
  
  // Technician assignment
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  
  // Data
  const myLeads = user ? getUserLeads(user.id) : [];
  const todaysScheduledCalls = user ? getScheduledCallsForToday(user.id) : [];
  const technicians = getTechnicians();
  
  // Helper for date comparison (ignores time)
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };
  const isPast = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    // Only compare date part
    return d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  // Tab logic
  const newLeads = myLeads.filter(l => l.status === 'new');
  const todayFollowupLeads = myLeads.filter(l =>
    l.status === 'ringing' ||
    (l.scheduled_call_date && isToday(l.scheduled_call_date)) ||
    (l.scheduled_call_date && isPast(l.scheduled_call_date) && (l.status === 'hold' || l.status === 'new'))
  );
  const overdueLeads = myLeads.filter(l =>
    (l.status === 'new' || l.status === 'hold') && l.scheduled_call_date && isPast(l.scheduled_call_date)
  );
  const holdLeads = myLeads.filter(l => l.status === 'hold');
  const delNotRespondLeads = myLeads.filter(l => l.status === 'ringing');
  const transitLeads = myLeads.filter(l => l.status === 'transit');
  const completedLeads = myLeads.filter(l => l.status === 'completed');
  const declinedLeads = myLeads.filter(l => l.status === 'declined');
  const allLeads = myLeads;

  // Tab list in required order
  const tabList = [
    { key: 'new', label: 'New', count: newLeads.length },
    { key: 'todayFollowup', label: 'Today Followup', count: todayFollowupLeads.length },
    { key: 'overdue', label: 'Overdue', count: overdueLeads.length },
    { key: 'hold', label: 'Hold', count: holdLeads.length },
    { key: 'delNotRespond', label: 'Del not respond', count: delNotRespondLeads.length },
    { key: 'transit', label: 'Transit', count: transitLeads.length },
    { key: 'all', label: 'All', count: allLeads.length },
    { key: 'completed', label: 'Completed', count: completedLeads.length },
    { key: 'declined', label: 'Declined', count: declinedLeads.length },
  ];

  // Filtering logic for selected tab
  let filteredLeads = allLeads;
  switch (selectedFilter) {
    case 'new':
      filteredLeads = newLeads;
      break;
    case 'todayFollowup':
      filteredLeads = todayFollowupLeads;
      break;
    case 'overdue':
      filteredLeads = overdueLeads;
      break;
    case 'hold':
      filteredLeads = holdLeads;
      break;
    case 'delNotRespond':
      filteredLeads = delNotRespondLeads;
      break;
    case 'transit':
      filteredLeads = transitLeads;
      break;
    case 'completed':
      filteredLeads = completedLeads;
      break;
    case 'declined':
      filteredLeads = declinedLeads;
      break;
    case 'all':
    default:
      filteredLeads = allLeads;
      break;
  }

  // Filtered leads with search
  let searchedLeads = filteredLeads;
  if (searchQuery.trim() !== '') {
    const q = searchQuery.trim().toLowerCase();
    searchedLeads = filteredLeads.filter(lead =>
      (lead.customer_name?.toLowerCase().includes(q)) ||
      (lead.phone_number?.toLowerCase().includes(q))
    );
  }

  const getStatusCounts = () => {
    const counts = {
      total: myLeads.length,
      new: myLeads.filter(l => l.status === 'new').length,
      contacted: myLeads.filter(l => l.status === 'contacted').length,
      transit: myLeads.filter(l => l.status === 'transit').length,
      hold: myLeads.filter(l => l.status === 'hold').length,
      today: todaysScheduledCalls.length,
    };
    return counts;
  };

  const counts = getStatusCounts();

  // Handle call - open dialer first, then navigate to lead info page
  const handleCall = (phone_number: string, leadId: string) => {
    if (Platform.OS === 'web') {
      Alert.alert('Call Feature', `Would call: ${phone_number}\n\nNote: Calling is not available in web preview.`);
    } else {
      Linking.openURL(`tel:${phone_number}`);
    }
    router.push({ pathname: '/(call_operator)/lead-info', params: { leadId } });
  };

  // Handle lead press - navigate to lead info page
  const handleLeadPress = (lead: Lead) => {
    router.push({ pathname: '/(call_operator)/lead-info', params: { leadId: lead.id } });
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedLead) {
      Alert.alert('Error', 'No lead selected for status update.');
      return;
    }

    try {
      await updateLeadStatus(selectedLead.id, newStatus, statusNotes);
      setShowStatusModal(false);
      setStatusNotes('');
      setSelectedLead(null);
      setNewStatus('contacted');
      Alert.alert('Success', 'Lead status updated successfully!');
      refreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead status');
    }
  };

  // Handle call later
  const handleCallLater = (lead: Lead) => {
    setSelectedLeadForCallLater(lead);
    setShowCallLaterModal(true);
  };

  const handleCallLaterSubmit = async () => {
    if (!selectedLeadForCallLater || !callLaterReason.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const combinedDateTime = new Date(
        callLaterDate.getFullYear(),
        callLaterDate.getMonth(),
        callLaterDate.getDate(),
        callLaterTime.getHours(),
        callLaterTime.getMinutes(),
        0, 0
      );

      await updateLeadStatusWithCallLater({
        leadId: selectedLeadForCallLater.id,
        newStatus: 'hold',
        notes: callLaterNotes,
        call_later_date: combinedDateTime.toISOString(),
        call_later_reason: callLaterReason
      });
      
      setShowCallLaterModal(false);
      setCallLaterDate(combinedDateTime);
      setCallLaterReason('');
      setCallLaterNotes('');
      setSelectedLeadForCallLater(null);
      Alert.alert('Success', 'Lead marked for call later successfully!');
      refreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark lead for call later');
    }
  };

  // Handle call later history
  const handleViewCallLaterHistory = async (lead: Lead) => {
    try {
      const logs = getCallLaterLogs(lead.id);
      setCallLaterLogs(logs);
      setSelectedLeadForCallLater(lead);
      setShowCallLaterHistoryModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load call later history');
    }
  };

  const handleViewHistory = (lead: Lead) => {
    setSelectedLead(lead);
    setShowCallHistoryModal(true);
  };

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a phone number to search');
      return;
    }
    setShowSearchModal(true);
  };

  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    return searchLeadsByPhone(searchQuery);
  };

  // Handle technician assignment
  const handleAssignTechnician = async (technicianId: string) => {
    if (!selectedLead) return;

    try {
      await assignLeadToTechnician(selectedLead.id, technicianId);
      setShowTechnicianModal(false);
      setSelectedLead(null);
      Alert.alert('Success', 'Lead assigned to technician successfully!');
      refreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign technician');
    }
  };

  // Refresh data
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

  // WhatsApp functionality
  const handleWhatsApp = (lead: Lead) => {
    setSelectedLeadForWhatsApp(lead);
    setShowWhatsAppModal(true);
    setSelectedMessage(null);
    setSelectedCategory('all');
  };

  const handleSendWhatsApp = async () => {
    if (!selectedLeadForWhatsApp || !selectedMessage) {
      Alert.alert('Error', 'Please select a message to send');
      return;
    }

    try {
      const phone_number = selectedLeadForWhatsApp.phone_number.replace(/\s/g, '');
      const message = encodeURIComponent(selectedMessage.message);
      const whatsappUrl = `whatsapp://send?phone=${phone_number}&text=${message}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        setShowWhatsAppModal(false);
        setSelectedLeadForWhatsApp(null);
        setSelectedMessage(null);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const getFilteredMessages = () => {
    const messages = getPredefinedMessages();
    if (selectedCategory === 'all') {
      return messages;
    }
    return messages.filter((message: PredefinedMessage) => message.category === selectedCategory);
  };

  // Utility functions
  const getGradientColors = () => {
    return ['#FF6B35', '#F97316', '#FB923C'] as const;
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.new;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Bell size={16} color={theme.primary} />;
      case 'contacted':
        return <PhoneCall size={16} color={theme.warning} />;
      case 'hold':
        return <Pause size={16} color={theme.textSecondary} />;
      case 'transit':
        return <ArrowRight size={16} color={theme.primary} />;
      case 'completed':
        return <CheckCircle size={16} color={theme.success} />;
      case 'declined':
        return <XCircle size={16} color={theme.error} />;
      default:
        return <Bell size={16} color={theme.primary} />;
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.ceil(searchedLeads.length / pageSize);
  const paginatedLeads = searchedLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page if filters/search/pageSize change
  }, [selectedFilter, searchQuery, pageSize]);

  // New state for Logs tab
  const [selectedLogLead, setSelectedLogLead] = useState<Lead | null>(null);
  const [showLogsTab, setShowLogsTab] = useState(false);

  // WhatsApp functionality state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<Lead | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<PredefinedMessage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (isLoading) {
    return <SkeletonLeadList count={4} />;
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold' }}>User not authenticated. Please log in again.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
                  {user.name}
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
                Manage your leads and track your performance
              </Text>
            </SlideInView>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94A3B8"
              />
            </View>
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
                  <Calendar size={20} color={theme.textInverse} />
                </View>
                <Text style={[styles.statNumber, { color: theme.text }]}>{todaysScheduledCalls.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Today's Leads</Text>
                <AnimatedProgressBar 
                  progress={todaysScheduledCalls.length / Math.max(myLeads.length, 1)} 
                  height={4}
                  color={theme.primary}
                  backgroundColor={theme.border}
                  style={styles.statProgress}
                />
              </AnimatedCard>
              
              <AnimatedCard index={1} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: theme.success }]}>
                  <PhoneCall size={20} color={theme.textInverse} />
                </View>
                <Text style={[styles.statNumber, { color: theme.text }]}>{myLeads.filter(l => l.status === 'new').length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Pending Calls</Text>
                <AnimatedProgressBar 
                  progress={myLeads.filter(l => l.status === 'new').length / Math.max(myLeads.length, 1)} 
                  height={4}
                  color={theme.success}
                  backgroundColor={theme.border}
                  style={styles.statProgress}
                />
              </AnimatedCard>
            </View>
          </View>
        </FadeInView>

        {/* Filter Tabs */}
        <SlideInView delay={800} duration={600} direction="up">
          <View style={styles.filterContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Leads</Text>
            <View style={styles.filterTabs}>
              {tabList.map((filter, index) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterTab,
                    selectedFilter === filter.key && { 
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                    { borderColor: theme.border }
                  ]}
                  onPress={() => {
                    if (filter.key === 'logs') {
                      setShowLogsTab(true);
                    } else {
                      setSelectedFilter(filter.key);
                      setShowLogsTab(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.filterTabText,
                    { 
                      color: selectedFilter === filter.key 
                        ? theme.textInverse 
                        : theme.textSecondary 
                    }
                  ]}>
                    {filter.label}
                  </Text>
                  <View style={[
                    styles.filterCount,
                    { 
                      backgroundColor: selectedFilter === filter.key 
                        ? theme.textInverse 
                        : theme.border 
                    }
                  ]}>
                    <Text style={[
                      styles.filterCountText,
                      { 
                        color: selectedFilter === filter.key 
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
            {paginatedLeads.map((lead, index) => (
              <AnimatedCard 
                key={lead.id} 
                index={index}
                style={[styles.leadCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => handleLeadPress(lead)}
              >
                <View style={styles.leadHeader}>
                  <View style={styles.leadInfo}>
                    <Text style={[styles.leadName, { color: theme.text }]}>{lead.customer_name}</Text>
                    <Text style={[styles.leadPhone, { color: theme.textSecondary }]}>{lead.phone_number}</Text>
                    {lead.additional_phone && (
                      <Text style={styles.additional_phone}>
                        Additional: {lead.additional_phone}
                      </Text>
                    )}
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(lead.status).bg }
                  ]}>
                    {getStatusIcon(lead.status)}
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(lead.status).text }
                    ]}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.leadDetails}>
                  <Text style={[styles.leadAddress, { color: theme.textSecondary }]}>
                    {lead.address}
                  </Text>
                  {lead.status === 'hold' && lead.scheduled_call_date ? (
                    <Text style={[styles.leadDate, { color: theme.textSecondary }]}> 
                      Scheduled: {new Date(lead.scheduled_call_date).toLocaleDateString()} {lead.scheduledCallTime ? `at ${lead.scheduledCallTime}` : ''}
                    </Text>
                  ) : (
                    <Text style={[styles.leadDate, { color: theme.textSecondary }]}> 
                      {new Date(lead.created_at).toLocaleDateString()}
                    </Text>
                  )}
                  {lead.call_later_count && lead.call_later_count > 0 && (
                    <Text style={[styles.call_later_count, { color: theme.warning }]}>
                      Call Later: {lead.call_later_count} times
                    </Text>
                  )}
                </View>
                
                <View style={styles.leadActions}>
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.actionButton, {backgroundColor: theme.primary}]}
                      onPress={(e) => {
                        e.stopPropagation(); // Prevent card's onPress from firing
                        handleCall(lead.phone_number, lead.id);
                      }}
                    >
                      <Phone size={16} color={theme.textInverse} />
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        Call
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionButton, {backgroundColor: '#25D366'}]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(lead);
                      }}
                    >
                      <MessageCircle size={16} color={theme.textInverse} />
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        WhatsApp
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.actionRow}>
                    {lead.status === 'new' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.success }]}
                        onPress={() => {
                          setSelectedLead(lead);
                          setNewStatus(lead.status);
                          setShowStatusModal(true);
                        }}
                      >
                        <MessageSquare size={16} color={theme.textInverse} />
                        <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                          Update
                        </Text>
                      </TouchableOpacity>
                    )}

                    {lead.status === 'contacted' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.warning }]}
                        onPress={() => {
                          setSelectedLead(lead);
                          setShowTechnicianModal(true);
                        }}
                      >
                        <ArrowRight size={16} color={theme.textInverse} />
                        <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                          Assign
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.primary }]}
                      onPress={() => handleCallLater(lead)}
                    >
                      <Clock size={16} color={theme.textInverse} />
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        Call Later
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {lead.call_later_count && lead.call_later_count > 0 && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.warning }]}
                        onPress={() => handleViewHistory(lead)}
                      >
                        <History size={16} color={theme.textInverse} />
                        <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                          History ({getCallLogs(lead.id).length})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </AnimatedCard>
            ))}
            
            {paginatedLeads.length === 0 && (
              <FadeInView delay={1200} duration={600}>
                <View style={styles.emptyState}>
                  <PulseView>
                    <View style={[styles.emptyIcon, { backgroundColor: theme.border }]}>
                      <Phone size={40} color={theme.textSecondary} />
                    </View>
                  </PulseView>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No leads found
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                    {selectedFilter === 'all' 
                      ? 'You don\'t have any leads assigned yet.'
                      : `No ${selectedFilter} leads at the moment.`
                    }
                  </Text>
                </View>
              </FadeInView>
            )}
          </View>
        </SlideInView>

        {/* Pagination Controls */}
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </Text>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.pageSizeContainer}>
            <Text style={styles.pageSizeLabel}>Page Size:</Text>
            <TextInput
              style={styles.pageSizeInput}
              value={pageSize.toString()}
              onChangeText={text => {
                const size = parseInt(text, 10);
                if (!isNaN(size) && size > 0) setPageSize(size);
              }}
              keyboardType="number-pad"
            />
          </View>
        </View>
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
            <Text style={styles.modalTitle}>Update Lead Status</Text>
            
            <Text style={styles.modalLabel}>Change Status</Text>
            <View style={styles.dropdownContainer}>
              <Picker
                selectedValue={newStatus}
                onValueChange={(itemValue: string) => setNewStatus(itemValue as LeadStatus)}
              >
                <Picker.Item label="Ringing" value="ringing" />
                <Picker.Item label="Hold" value="hold" />
                <Picker.Item label="Transit" value="transit" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Declined" value="declined" />
              </Picker>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Add notes about this status update..."
              value={statusNotes}
              onChangeText={setStatusNotes}
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

      {/* Call Later Modal */}
      <Modal
        visible={showCallLaterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCallLaterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark for Call Later</Text>
            {selectedLeadForCallLater && (
              <Text style={styles.modalLabel}>Customer: {selectedLeadForCallLater.customer_name}</Text>
            )}
            
            <Text style={styles.modalLabel}>Call Later Date</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowCallLaterDatePicker(true)}
            >
              <Calendar size={20} color="#64748B" />
              <Text style={styles.datePickerButtonText}>
                {callLaterDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.modalLabel}>Reason *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Why are you marking this for call later?"
              placeholderTextColor="#64748B"
              value={callLaterReason}
              onChangeText={setCallLaterReason}
              multiline
            />
            
            <Text style={styles.modalLabel}>Time</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowCallLaterTimePicker(true)}
            >
              <Calendar size={20} color="#64748B" />
              <Text style={styles.datePickerButtonText}>
                {callLaterTime.toLocaleTimeString()}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCallLaterModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCallLaterSubmit}
              >
                <Text style={styles.confirmButtonText}>Mark for Call Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Call Later History Modal */}
      <Modal
        visible={showCallLaterHistoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCallLaterHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Call Later History</Text>
            {selectedLeadForCallLater && (
              <Text style={styles.modalLabel}>Customer: {selectedLeadForCallLater.customer_name}</Text>
            )}
            
            <ScrollView style={styles.historyContainer}>
              {callLaterLogs.map((log, index) => (
                <View key={log.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(log.call_later_date).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyOperator}>
                      by {log.call_operator_name}
                    </Text>
                  </View>
                  <Text style={styles.historyReason}>{log.reason}</Text>
                  {log.notes && (
                    <Text style={styles.historyNotes}>{log.notes}</Text>
                  )}
                  <Text style={styles.historyTime}>
                    {new Date(log.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))}
              {callLaterLogs.length === 0 && (
                <Text style={styles.noResultsText}>
                  No call later history found
                </Text>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCallLaterHistoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Search Leads by Phone</Text>
            <Text style={styles.modalLabel}>Search Results for: {searchQuery}</Text>
            
            <ScrollView style={styles.searchResultsContainer}>
              {getSearchResults().map((lead, index) => (
                <TouchableOpacity
                  key={lead.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    setSelectedLead(lead);
                    setNewStatus(lead.status);
                    setShowSearchModal(false);
                    setShowStatusModal(true);
                  }}
                >
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <View>
                      <Text style={styles.searchResultName}>{lead.customer_name}</Text>
                      <Text style={styles.searchResultPhone}>{lead.phone_number}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleCall(lead.phone_number, lead.id)}>
                      <Phone size={24} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              {getSearchResults().length === 0 && searchQuery.trim() && (
                <Text style={styles.noResultsText}>No leads found for "{searchQuery}"</Text>
              )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSearchModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Technician Assignment Modal */}
      <Modal
        visible={showTechnicianModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTechnicianModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Technician</Text>
            
            <ScrollView style={styles.technicianList}>
              {technicians.map((tech) => (
                <TouchableOpacity
                  key={tech.id}
                  style={styles.technicianOption}
                  onPress={() => handleAssignTechnician(tech.id)}
                >
                  <View style={styles.technicianInfo}>
                    <Text style={styles.technicianName}>{tech.name}</Text>
                    <Text style={styles.technicianDetails}>{tech.phone}</Text>
                    <Text style={styles.technicianSpecialization}>Technician</Text>
                  </View>
                  <ArrowRight size={20} color="#64748B" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTechnicianModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Call Later Date Picker Modal */}
      <Modal
        visible={showCallLaterDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCallLaterDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.modalTitle}>Select Call Later Date</Text>
            <DateTimePicker
              value={callLaterDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowCallLaterDatePicker(false);
                if (selectedDate) {
                  setCallLaterDate(selectedDate);
                }
              }}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCallLaterDatePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Call Later Time Picker Modal */}
      <Modal
        visible={showCallLaterTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCallLaterTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.modalTitle}>Select Call Later Time</Text>
            <DateTimePicker
              value={callLaterTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowCallLaterTimePicker(false);
                if (selectedTime) {
                  setCallLaterTime(selectedTime);
                }
              }}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCallLaterTimePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Call History Modal */}
      <Modal visible={showCallHistoryModal} transparent animationType="slide" onRequestClose={() => setShowCallHistoryModal(false)}>
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
            <TouchableOpacity style={{ marginTop: 16, backgroundColor: '#F1F5F9', borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={() => setShowCallHistoryModal(false)}>
              <Text style={{ color: '#64748B', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logs Tab Content */}
      {showLogsTab && selectedLogLead && (
        <View style={{ padding: 20 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Call Logs for {selectedLogLead.customer_name}</Text>
          {getCallLogs(selectedLogLead.id).length === 0 ? (
            <Text>No call logs found for this lead.</Text>
          ) : (
            getCallLogs(selectedLogLead.id).map((log, idx) => (
              <View key={log.id || idx} style={{ marginBottom: 10, padding: 10, backgroundColor: '#F3F4F6', borderRadius: 8 }}>
                <Text>Date: {log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</Text>
                <Text>Operator: {log.caller_name || '-'}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* WhatsApp Message Selection Modal */}
      <Modal
        visible={showWhatsAppModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWhatsAppModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Select WhatsApp Message</Text>
            
            {selectedLeadForWhatsApp && (
              <Text style={styles.modalLabel}>
                Customer: {selectedLeadForWhatsApp.customer_name} ({selectedLeadForWhatsApp.phone_number})
              </Text>
            )}

            <View style={styles.filterContainer}>
              <Text style={styles.modalLabel}>Filter by Category:</Text>
              <View style={styles.filterTabs}>
                <TouchableOpacity
                  style={[styles.filterTab, selectedCategory === 'all' && { backgroundColor: theme.primary }]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={[styles.filterTabText, selectedCategory === 'all' && { color: theme.textInverse }]}>
                    All
                  </Text>
                </TouchableOpacity>
                {MESSAGE_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[styles.filterTab, selectedCategory === category.value && { backgroundColor: theme.primary }]}
                    onPress={() => setSelectedCategory(category.value)}
                  >
                    <Text style={[styles.filterTabText, selectedCategory === category.value && { color: theme.textInverse }]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <ScrollView style={styles.searchResultsContainer}>
              {getFilteredMessages().length > 0 ? (
                getFilteredMessages().map((message) => (
                  <TouchableOpacity
                    key={message.id}
                    style={[
                      styles.messageOption,
                      selectedMessage?.id === message.id && { backgroundColor: theme.primaryLight, borderColor: theme.primary }
                    ]}
                    onPress={() => setSelectedMessage(message)}
                  >
                    <Text style={styles.messageTitle}>{message.title}</Text>
                    <Text style={styles.messageContent} numberOfLines={2}>
                      {message.message}
                    </Text>
                    <View style={styles.messageCategory}>
                      <Text style={styles.categoryText}>
                        {MESSAGE_CATEGORIES.find(c => c.value === message.category)?.label || message.category}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No messages found in this category</Text>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowWhatsAppModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, !selectedMessage && { opacity: 0.5 }]}
                onPress={handleSendWhatsApp}
                disabled={!selectedMessage}
              >
                <Text style={styles.confirmButtonText}>Send WhatsApp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}