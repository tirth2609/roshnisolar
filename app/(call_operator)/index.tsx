import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
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

  // General state
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all' | 'today'>('new');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  // WhatsApp functionality state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<Lead | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<PredefinedMessage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data
  const myLeads = user ? getUserLeads(user.id) : [];
  const todaysScheduledCalls = user ? getScheduledCallsForToday(user.id) : [];
  const technicians = getTechnicians();

  // Helper for date comparison (ignores time)
  const isToday = useCallback((dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  }, []);
  const isPast = useCallback((dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // Tab logic
  const newLeads = useMemo(() => myLeads.filter(l => l.status === 'new'), [myLeads]);
  const todayFollowupLeads = useMemo(() => myLeads.filter(l =>
    l.status === 'ringing' ||
    (l.scheduled_call_date && isToday(l.scheduled_call_date)) ||
    (l.scheduled_call_date && isPast(l.scheduled_call_date) && (l.status === 'hold' || l.status === 'new'))
  ), [myLeads, isToday, isPast]);
  const overdueLeads = useMemo(() => myLeads.filter(l =>
    (l.status === 'new' || l.status === 'hold') && l.scheduled_call_date && isPast(l.scheduled_call_date)
  ), [myLeads, isPast]);
  const holdLeads = useMemo(() => myLeads.filter(l => l.status === 'hold'), [myLeads]);
  const delNotRespondLeads = useMemo(() => myLeads.filter(l => l.status === 'ringing'), [myLeads]);
  const transitLeads = useMemo(() => myLeads.filter(l => l.status === 'transit'), [myLeads]);
  const completedLeads = useMemo(() => myLeads.filter(l => l.status === 'completed'), [myLeads]);
  const declinedLeads = useMemo(() => myLeads.filter(l => l.status === 'declined'), [myLeads]);
  const allLeads = myLeads;

  // Tab list in required order
  const tabList = useMemo(() => [
    { key: 'new', label: 'New', count: newLeads.length },
    { key: 'todayFollowup', label: 'Today Followup', count: todayFollowupLeads.length },
    { key: 'overdue', label: 'Overdue', count: overdueLeads.length },
    { key: 'hold', label: 'Hold', count: holdLeads.length },
    { key: 'delNotRespond', label: 'Del not respond', count: delNotRespondLeads.length },
    { key: 'transit', label: 'Transit', count: transitLeads.length },
    { key: 'all', label: 'All', count: allLeads.length },
    { key: 'completed', label: 'Completed', count: completedLeads.length },
    { key: 'declined', label: 'Declined', count: declinedLeads.length },
  ], [newLeads, todayFollowupLeads, overdueLeads, holdLeads, delNotRespondLeads, transitLeads, completedLeads, declinedLeads, allLeads]);

  // Filtering logic for selected tab
  const filteredLeads = useMemo(() => {
    switch (selectedFilter) {
      case 'new': return newLeads;
      case 'todayFollowup': return todayFollowupLeads;
      case 'overdue': return overdueLeads;
      case 'hold': return holdLeads;
      case 'delNotRespond': return delNotRespondLeads;
      case 'transit': return transitLeads;
      case 'completed': return completedLeads;
      case 'declined': return declinedLeads;
      case 'all': default: return allLeads;
    }
  }, [selectedFilter, newLeads, todayFollowupLeads, overdueLeads, holdLeads, delNotRespondLeads, transitLeads, completedLeads, declinedLeads, allLeads]);

  // Filtered leads with search
  const searchedLeads = useMemo(() => {
    if (searchQuery.trim() === '') return filteredLeads;
    const q = searchQuery.trim().toLowerCase();
    return filteredLeads.filter(lead =>
      (lead.customer_name?.toLowerCase().includes(q)) ||
      (lead.phone_number?.toLowerCase().includes(q))
    );
  }, [filteredLeads, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(searchedLeads.length / pageSize);
  const paginatedLeads = searchedLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page if filters/search/pageSize change
  }, [selectedFilter, searchQuery, pageSize]);

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

  const handleCall = useCallback((phone_number: string, leadId: string) => {
    if (isSubmitting) return;
    if (Platform.OS === 'web') {
      Alert.alert('Call Feature', `Would call: ${phone_number}\n\nNote: Calling is not available in web preview.`);
    } else {
      Linking.openURL(`tel:${phone_number}`);
    }
    router.push({ pathname: '/(call_operator)/lead-info', params: { leadId } });
  }, [isSubmitting]);

  const handleLeadPress = useCallback((lead: Lead) => {
    if (isSubmitting) return;
    router.push({ pathname: '/(call_operator)/lead-info', params: { leadId: lead.id } });
  }, [isSubmitting]);

  const handleStatusUpdate = useCallback(async () => {
    if (!selectedLead || isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLead, isSubmitting, newStatus, statusNotes, updateLeadStatus, refreshData]);

  const handleCallLater = useCallback((lead: Lead) => {
    if (isSubmitting) return;
    setSelectedLeadForCallLater(lead);
    setShowCallLaterModal(true);
  }, [isSubmitting]);

  const handleCallLaterSubmit = useCallback(async () => {
    if (!selectedLeadForCallLater || !callLaterReason.trim() || isSubmitting) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLeadForCallLater, callLaterReason, isSubmitting, callLaterDate, callLaterTime, callLaterNotes, updateLeadStatusWithCallLater, refreshData]);

  const handleViewCallLaterHistory = useCallback(async (lead: Lead) => {
    try {
      const logs = getCallLaterLogs(lead.id);
      setCallLaterLogs(logs);
      setSelectedLeadForCallLater(lead);
      setShowCallLaterHistoryModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load call later history');
    }
  }, [getCallLaterLogs]);

  const handleViewHistory = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setShowCallHistoryModal(true);
  }, []);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a phone number to search');
      return;
    }
    setShowSearchModal(true);
  }, [searchQuery]);

  const getSearchResults = useCallback(() => {
    if (!searchQuery.trim()) return [];
    return searchLeadsByPhone(searchQuery);
  }, [searchQuery, searchLeadsByPhone]);

  const handleAssignTechnician = useCallback(async (technicianId: string) => {
    if (!selectedLead || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await assignLeadToTechnician(selectedLead.id, technicianId);
      setShowTechnicianModal(false);
      setSelectedLead(null);
      Alert.alert('Success', 'Lead assigned to technician successfully!');
      refreshData();
    } catch (error) {
      Alert.alert('Error', 'Failed to assign technician');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLead, isSubmitting, assignLeadToTechnician, refreshData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const handleWhatsApp = useCallback((lead: Lead) => {
    if (isSubmitting) return;
    setSelectedLeadForWhatsApp(lead);
    setShowWhatsAppModal(true);
    setSelectedMessage(null);
    setSelectedCategory('all');
  }, [isSubmitting]);

  const handleSendWhatsApp = useCallback(async () => {
    if (!selectedLeadForWhatsApp || !selectedMessage || isSubmitting) {
      Alert.alert('Error', 'Please select a message to send');
      return;
    }
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLeadForWhatsApp, selectedMessage, isSubmitting]);

  const getFilteredMessages = useCallback(() => {
    const messages = getPredefinedMessages();
    if (selectedCategory === 'all') {
      return messages;
    }
    return messages.filter((message: PredefinedMessage) => message.category === selectedCategory);
  }, [selectedCategory, getPredefinedMessages]);

  const getGradientColors = useCallback(() => {
    return ['#FF6B35', '#F97316', '#FB923C'] as const;
  }, []);

  const getStatusColor = useCallback((status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.new;
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'new': return <Bell size={16} color={theme.primary} />;
      case 'contacted': return <PhoneCall size={16} color={theme.warning} />;
      case 'hold': return <Pause size={16} color={theme.textSecondary} />;
      case 'transit': return <ArrowRight size={16} color={theme.primary} />;
      case 'completed': return <CheckCircle size={16} color={theme.success} />;
      case 'declined': return <XCircle size={16} color={theme.error} />;
      default: return <Bell size={16} color={theme.primary} />;
    }
  }, [theme]);

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
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color="#94A3B8" style={styles.searchIcon} />
                <TextInput
                  style={[{ flex: 1, color: theme.text }]}
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  onSubmitEditing={handleSearch}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                    <XCircle size={20} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
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
                  onPress={() => setSelectedFilter(filter.key)}
                  disabled={isSubmitting}
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
                      style={[styles.actionButton, { backgroundColor: theme.primary, opacity: isSubmitting ? 0.6 : 1 }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCall(lead.phone_number, lead.id);
                      }}
                      disabled={isSubmitting}
                    >
                      <Phone size={16} color={theme.textInverse} />
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        Call
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#25D366', opacity: isSubmitting ? 0.6 : 1 }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleWhatsApp(lead);
                      }}
                      disabled={isSubmitting}
                    >
                      <MessageCircle size={16} color={theme.textInverse} />
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        WhatsApp
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionRow}>
                    {lead.status !== 'completed' && lead.status !== 'declined' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.success, opacity: isSubmitting ? 0.6 : 1 }]}
                        onPress={() => {
                          setSelectedLead(lead);
                          setNewStatus(lead.status);
                          setShowStatusModal(true);
                        }}
                        disabled={isSubmitting}
                      >
                        <MessageSquare size={16} color={theme.textInverse} />
                        <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                          Update
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.warning, opacity: isSubmitting ? 0.6 : 1 }]}
                      onPress={() => handleCallLater(lead)}
                      disabled={isSubmitting}
                    >
                      <Clock size={16} color={theme.textInverse} />
                      <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                        Call Later
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.actionRow}>
                  {lead.call_later_count && lead.call_later_count > 0 && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#FF6B35', opacity: isSubmitting ? 0.6 : 1 }]}
                        onPress={() => handleViewHistory(lead)}
                        disabled={isSubmitting}
                      >
                        <History size={16} color={theme.textInverse} />
                        <Text style={[styles.actionButtonText, { color: theme.textInverse }]}>
                          History ({getCallLogs(lead.id).length})
                        </Text>
                      </TouchableOpacity>
                  )}
                  </View>
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
                <Picker.Item label="Contacted" value="contacted" />
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
              editable={!isSubmitting}
            />

            <View style={[styles.modalActions, { justifyContent: 'space-between', gap: 12 }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => setShowStatusModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { flex: 1, opacity: isSubmitting ? 0.6 : 1 }]}
                onPress={handleStatusUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Update</Text>
                )}
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
              disabled={isSubmitting}
            >
              <Calendar size={20} color="#64748B" />
              <Text style={styles.datePickerButtonText}>
                {callLaterDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.modalLabel}>Call Later Time</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowCallLaterTimePicker(true)}
              disabled={isSubmitting}
            >
              <Clock size={20} color="#64748B" />
              <Text style={styles.datePickerButtonText}>
                {callLaterTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              editable={!isSubmitting}
            />

            <Text style={styles.modalLabel}>Notes</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Additional notes..."
              placeholderTextColor="#64748B"
              value={callLaterNotes}
              onChangeText={setCallLaterNotes}
              multiline
              editable={!isSubmitting}
            />
            <View style={[styles.modalActions, { justifyContent: 'space-between', gap: 12 }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1 }]}
                onPress={() => setShowCallLaterModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { flex: 1, opacity: isSubmitting ? 0.6 : 1 }]}
                onPress={handleCallLaterSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Mark for Call Later</Text>
                )}
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
                    <Text style={styles.historyTime}>
                      {new Date(log.call_later_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.historyReason}>{log.call_later_reason}</Text>
                  {log.notes && (
                    <Text style={styles.historyNotes}>{log.notes}</Text>
                  )}
                  <Text style={styles.historyOperator}>
                    Logged by {log.call_operator_name} on {new Date(log.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
              {callLaterLogs.length === 0 && (
                <Text style={styles.noResultsText}>
                  No call later history found
                </Text>
              )}
            </ScrollView>

            <View style={[styles.modalActions, { justifyContent: 'center' }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1, backgroundColor: theme.surface }]}
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
                  disabled={isSubmitting}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={styles.searchResultName}>{lead.customer_name}</Text>
                      <Text style={styles.searchResultPhone}>{lead.phone_number}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleCall(lead.phone_number, lead.id)} disabled={isSubmitting}>
                      <Phone size={24} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              {getSearchResults().length === 0 && searchQuery.trim() && (
                <Text style={styles.noResultsText}>No leads found for "{searchQuery}"</Text>
              )}
            </ScrollView>
            
            <View style={[styles.modalActions, { justifyContent: 'center' }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1, backgroundColor: theme.surface }]}
                onPress={() => setShowSearchModal(false)}
                disabled={isSubmitting}
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
              {technicians.length > 0 ? (
                technicians.map((tech) => (
                  <TouchableOpacity
                    key={tech.id}
                    style={styles.technicianOption}
                    onPress={() => handleAssignTechnician(tech.id)}
                    disabled={isSubmitting}
                  >
                    <View style={styles.technicianInfo}>
                      <Text style={styles.technicianName}>{tech.name}</Text>
                      <Text style={styles.technicianDetails}>{tech.phone}</Text>
                      <Text style={styles.technicianSpecialization}>Technician</Text>
                    </View>
                    <ArrowRight size={20} color="#64748B" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No technicians available.</Text>
              )}
            </ScrollView>

            <View style={[styles.modalActions, { justifyContent: 'center' }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1, backgroundColor: theme.surface }]}
                onPress={() => setShowTechnicianModal(false)}
                disabled={isSubmitting}
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>Call History</Text>
            {selectedLead && <Text style={{ color: theme.textSecondary, marginBottom: 12 }}>Lead: {selectedLead.customer_name}</Text>}
            <ScrollView>
              {selectedLead && getCallLogs(selectedLead.id).length > 0 ? (
                getCallLogs(selectedLead.id).map((log: CallLog) => (
                  <View key={log.id} style={{ borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 12 }}>
                    <Text style={{ fontSize: 14, color: theme.text }}>Called by: {log.caller_name || 'Unknown'}</Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>On: {new Date(log.created_at).toLocaleString()}</Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>Notes: {log.notes || 'N/A'}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noResultsText}>No call history found for this lead.</Text>
              )}
            </ScrollView>
            <TouchableOpacity style={{ marginTop: 16, backgroundColor: theme.surface, borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={() => setShowCallHistoryModal(false)}>
              <Text style={{ color: theme.textSecondary, fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <Text style={styles.modalLabel}>
              Customer: {selectedLeadForWhatsApp?.customer_name} ({selectedLeadForWhatsApp?.phone_number})
            </Text>

            <View style={styles.filterContainer}>
              <Text style={styles.modalLabel}>Filter by Category:</Text>
              <View style={styles.filterTabs}>
                <TouchableOpacity
                  style={[styles.filterTab, selectedCategory === 'all' && { backgroundColor: theme.primary }]}
                  onPress={() => setSelectedCategory('all')}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.filterTabText, selectedCategory === 'all' && { color: theme.textInverse }]}>All</Text>
                </TouchableOpacity>
                {MESSAGE_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    style={[styles.filterTab, selectedCategory === category.value && { backgroundColor: theme.primary }]}
                    onPress={() => setSelectedCategory(category.value)}
                    disabled={isSubmitting}
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
                      selectedMessage?.id === message.id && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                      { opacity: isSubmitting ? 0.6 : 1 }
                    ]}
                    onPress={() => setSelectedMessage(message)}
                    disabled={isSubmitting}
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

            <View style={[styles.modalActions, { justifyContent: 'space-between', gap: 12 }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { flex: 1, backgroundColor: theme.surface }]}
                onPress={() => setShowWhatsAppModal(false)}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { flex: 1, opacity: (!selectedMessage || isSubmitting) ? 0.6 : 1 }]}
                onPress={handleSendWhatsApp}
                disabled={!selectedMessage || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Send WhatsApp</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
