import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Calendar, 
  Phone,
  Wrench,
  Headphones,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Target,
  Zap,
  Upload,
  FileText,
  UserPlus,
  Crown,
  Menu,
  Settings,
  Bell,
  FileUp,
  Download,
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NewLeadData, PropertyType, LeadLikelihood, LeadStatus } from '@/types/leads';
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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
// import * as Sharing from 'expo-sharing';
import { ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');

// Utility: isWebLargeScreen
const isWebLargeScreen = Platform.OS === 'web' && width >= 900;

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { 
    leads, 
    supportTickets, 
    getAllUsers, 
    getAnalytics, 
    bulkImportLeads,
    isLoading, 
    refreshData,
    fetchLeads,
  } = useData();
  const { theme } = useTheme();
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const analytics = getAnalytics();
  const users = getAllUsers();

  // Fetch all leads on mount
  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page if leads or pageSize changes
  }, [leads, pageSize]);

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

  const getLeadsByStatus = () => {
    return {
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      transit: leads.filter(l => l.status === 'transit').length,
      completed: leads.filter(l => l.status === 'completed').length,
      declined: leads.filter(l => l.status === 'declined').length,
      hold: leads.filter(l => l.status === 'hold').length,
    };
  };

  const getTicketsByStatus = () => {
    return {
      open: supportTickets.filter(t => t.status === 'open').length,
      in_progress: supportTickets.filter(t => t.status === 'in_progress').length,
      resolved: supportTickets.filter(t => t.status === 'resolved').length,
      closed: supportTickets.filter(t => t.status === 'closed').length,
    };
  };

  const getUsersByRole = () => {
    return {
      salesman: users.filter(u => u.role === 'salesman').length,
      call_operator: users.filter(u => u.role === 'call_operator').length,
      technician: users.filter(u => u.role === 'technician').length,
      super_admin: users.filter(u => u.role === 'super_admin').length,
    };
  };

  const leadStats = getLeadsByStatus();
  const ticketStats = getTicketsByStatus();
  const userStats = getUsersByRole();

  // --- CSV Import/Export Logic ---
  const LEAD_IMPORT_COLUMNS = [
    'id',
    'customer_name',
    'phone_number',
    'email',
    'address',
    'property_type',
    'likelihood',
    'status',
    'salesman_id',
    'salesman_name',
    'call_operator_id',
    'call_operator_name',
    'technician_id',
    'technician_name',
    'call_notes',
    'visit_notes',
    'follow_up_date',
    'created_at',
    'updated_at',
  ];

  const parseCSVData = (csvText: string) => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leads = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      const lead: any = {};
      headers.forEach((header, idx) => {
        lead[header] = values[idx] || '';
      });
      leads.push({
        id: lead.id,
        customer_name: lead.customer_name,
        phone_number: lead.phone_number,
        email: lead.email,
        address: lead.address,
        property_type: lead.property_type,
        likelihood: lead.likelihood,
        status: lead.status,
        salesman_id: lead.salesman_id,
        salesman_name: lead.salesman_name,
        call_operator_id: lead.call_operator_id,
        call_operator_name: lead.call_operator_name,
        technician_id: lead.technician_id,
        technician_name: lead.technician_name,
        call_notes: lead.call_notes,
        visit_notes: lead.visit_notes,
        follow_up_date: lead.follow_up_date,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      });
    }
    return leads;
  };

  // Export all leads as CSV
  const exportLeadsToCSV = async () => {
    if (!leads || leads.length === 0) {
      Alert.alert('No Data', 'No leads to export.');
      return;
    }
    const csvRows = [];
    csvRows.push(LEAD_IMPORT_COLUMNS.join(','));
    for (const lead of leads) {
      const l = lead as any;
      const row = LEAD_IMPORT_COLUMNS.map(col => {
        let val = l[
          col === 'customer_name' ? 'customer_name' :
          col === 'phone_number' ? 'phone_number' :
          col === 'additional_phone' ? 'additionalPhone' :
          col === 'call_notes' ? 'call_notes' :
          col === 'visit_notes' ? 'visit_notes' :
          col === 'follow_up_date' ? 'follow_up_date' :
          col === 'scheduled_call_date' ? 'scheduledCallDate' :
          col === 'scheduled_call_time' ? 'scheduledCallTime' :
          col === 'scheduled_call_reason' ? 'scheduledCallReason' :
          col === 'call_later_count' ? 'callLaterCount' :
          col === 'last_call_later_date' ? 'lastCallLaterDate' :
          col === 'last_call_later_reason' ? 'lastCallLaterReason' :
          col === 'customer_id' ? 'customerId' :
          col
        ];
        if (val === undefined || val === null) val = '';
        // Escape commas and quotes
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      });
      csvRows.push(row.join(','));
    }
    const csvString = csvRows.join('\n');
    try {
      if (Platform.OS === 'web') {
        // Download as file
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'leads_export.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const Sharing = require('expo-sharing');
        const fileUri = FileSystem.cacheDirectory + 'leads_export.csv';
        await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Leads CSV' });
      }
    } catch (err: any) {
      Alert.alert('Export Failed', 'Could not export leads: ' + err.message);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }
      
      const asset = result.assets[0];
      setFileName(asset.name);

      if (Platform.OS === 'web') {
        // On web, result.assets[0].file is the File object
        const file = asset.file;
        if (!file) {
          throw new Error('File object not available on web.');
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (typeof content === 'string') {
            setCsvData(content);
          } else {
            Alert.alert('Error', 'Could not read file content.');
          }
        };
        reader.onerror = () => {
          Alert.alert('Error', 'Failed to read the file.');
        };
        reader.readAsText(file);
      } else {
        // Native platform
        const fileContent = await FileSystem.readAsStringAsync(asset.uri);
        setCsvData(fileContent);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick or read the file.');
      console.error('Error picking file:', error);
    }
  };

  const handleBulkImport = async () => {
    if (!csvData.trim()) {
      Alert.alert('Error', 'Please select a CSV file to import.');
      return;
    }

    setIsImporting(true);
    try {
      const leadsData = parseCSVData(csvData);
      
      if (leadsData.length === 0) {
        Alert.alert('Error', 'No valid leads found in CSV data. Please check the format.');
        setIsImporting(false);
        return;
      }

      await bulkImportLeads(leadsData);
      
      Alert.alert('Success', `${leadsData.length} leads imported successfully!`);

      setShowBulkImportModal(false);
      setCsvData('');
      setFileName('');
    } catch (error: any) {
      Alert.alert('Error', `Failed to import leads: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const getGradientColors = () => {
    return ['#DC2626', '#EF4444', '#F87171'] as const;
  };

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: '₹45.2L',
      change: '+12.5%',
      icon: DollarSign,
      color: '#10B981',
      bgColor: '#F0FDF4'
    },
    {
      title: 'Conversion Rate',
      value: `${analytics.conversionRate}%`,
      change: '+2.1%',
      icon: Target,
      color: '#3B82F6',
      bgColor: '#EBF8FF'
    },
    {
      title: 'Active Users',
      value: analytics.activeUsers.toString(),
      change: '+5',
      icon: Users,
      color: '#8B5CF6',
      bgColor: '#F3E8FF'
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      change: '+0.1%',
      icon: Zap,
      color: '#F59E0B',
      bgColor: '#FFFBEB'
    }
  ];

  const filteredLeads = leads.filter(lead =>
    lead.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return <SkeletonLeadList count={4} />;
  }

  if (isLoading || !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading dashboard...</Text>
      </View>
    );
  }

  const kpiCardWidth = isWebLargeScreen ? '23%' : '48%'; // 4 per row on web, 2 per row on mobile
  const actionCardWidth = isWebLargeScreen ? '23%' : '48%';
  const gridStyle = isWebLargeScreen
    ? { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const }
    : styles.grid2col;

  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 700;

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
                  {user.name}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                >
                  <Settings size={20} color={theme.textInverse} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  onPress={() => router.push('/(super_admin)/profile')}
                >
                  <Menu size={20} color={theme.textInverse} />
                </TouchableOpacity>
              </View>
            </View>
            
            <SlideInView delay={200} duration={600} direction="up">
              <Text style={[styles.headerSubtitle, { color: theme.textInverse }]}>
                Super Admin Dashboard - Manage your entire system
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
        {/* KPI Cards - 2 column grid */}
        <FadeInView delay={400} duration={600}>
          <View style={styles.kpiContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Performance Indicators</Text>
            <View style={gridStyle}>
              {kpiCards.map((kpi, index) => (
                <AnimatedCard key={kpi.title} index={index} style={[styles.kpiCard, { width: kpiCardWidth }]}>
                  <View style={[styles.kpiIcon, { backgroundColor: kpi.bgColor }]}>
                    <kpi.icon size={24} color={kpi.color} />
                  </View>
                  <Text style={[styles.kpiValue, { color: theme.text }]}>{kpi.value}</Text>
                  <Text style={[styles.kpiTitle, { color: theme.textSecondary }]}>{kpi.title}</Text>
                  <View style={styles.kpiChange}>
                    <TrendingUp size={12} color="#10B981" />
                    <Text style={styles.kpiChangeText}>{kpi.change}</Text>
                  </View>
                </AnimatedCard>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Quick Actions - 2 column grid */}
        <SlideInView delay={600} duration={600} direction="up">
          <View style={styles.actionsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
            {isSmallScreen ? (
              <View style={styles.quickActionsGridSmall}>
                {[0,1,2,3,4].map(idx => (
                  <AnimatedCard
                    key={idx}
                    style={{
                      width: '48%',
                      backgroundColor: '#fff',
                      padding: 16,
                      borderRadius: 16,
                      marginBottom: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                    }}
                  >
                    {idx === 0 && (
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.primary }]} onPress={() => router.push('/(super_admin)/users')}>
                        <UserPlus size={24} color={theme.textInverse} />
                        <Text style={[styles.actionText, { color: theme.textInverse }]}>Manage Users</Text>
                      </TouchableOpacity>
                    )}
                    {idx === 1 && (
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.success }]} onPress={() => setShowBulkImportModal(true)}>
                        <Upload size={24} color={theme.textInverse} />
                        <Text style={[styles.actionText, { color: theme.textInverse }]}>Bulk Import</Text>
                      </TouchableOpacity>
                    )}
                    {idx === 2 && (
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.warning }]} onPress={() => router.push('/(super_admin)/lead-assignment')}>
                        <Target size={24} color={theme.textInverse} />
                        <Text style={[styles.actionText, { color: theme.textInverse }]}>Lead Assignment</Text>
                      </TouchableOpacity>
                    )}
                    {idx === 3 && (
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.info }]} onPress={() => router.push('/(super_admin)/work-tracking')}>
                        <BarChart3 size={24} color={theme.textInverse} />
                        <Text style={[styles.actionText, { color: theme.textInverse }]}>Analytics</Text>
                      </TouchableOpacity>
                    )}
                    {idx === 4 && (
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.info }]} onPress={exportLeadsToCSV}>
                        <Download size={24} color={theme.textInverse} />
                        <Text style={[styles.actionText, { color: theme.textInverse }]}>Export Leads</Text>
                      </TouchableOpacity>
                    )}
                  </AnimatedCard>
                ))}
              </View>
            ) : (
              <View style={styles.quickActionsRow}>
                {[
                  { title: 'Manage Users', icon: UserPlus, color: theme.primary, onPress: () => router.push('/(super_admin)/users') },
                  { title: 'Bulk Import', icon: Upload, color: theme.success, onPress: () => setShowBulkImportModal(true) },
                  { title: 'Lead Assignment', icon: Target, color: theme.warning, onPress: () => router.push('/(super_admin)/lead-assignment') },
                  { title: 'Analytics', icon: BarChart3, color: theme.info, onPress: () => router.push('/(super_admin)/work-tracking') },
                  { title: 'Export Leads', icon: Download, color: theme.info, onPress: exportLeadsToCSV },
                ].map((action, index) => (
                  <AnimatedCard
                    key={action.title}
                    style={{
                      width: '19%',
                      backgroundColor: '#fff',
                      padding: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      elevation: 2,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                    }}
                  >
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: action.color }]}
                      onPress={action.onPress}
                    >
                      <action.icon size={24} color={theme.textInverse} />
                      <Text style={[styles.actionText, { color: theme.textInverse }]}>{action.title}</Text>
                    </TouchableOpacity>
                  </AnimatedCard>
                ))}
              </View>
            )}
          </View>
        </SlideInView>

        {/* Statistics Overview - 2 column grid */}
        <SlideInView delay={800} duration={600} direction="up">
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>System Overview</Text>
            <View style={styles.grid2col}>
              <AnimatedCard index={4} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Users size={20} color={theme.primary} />
                  <Text style={[styles.statTitle, { color: theme.text }]}>Total Users</Text>
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{users.length}</Text>
                <View style={styles.statBreakdown}>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Salesmen: {userStats.salesman}
                  </Text>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Operators: {userStats.call_operator}
                  </Text>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Technicians: {userStats.technician}
                  </Text>
                </View>
              </AnimatedCard>

              <AnimatedCard index={5} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Target size={20} color={theme.success} />
                  <Text style={[styles.statTitle, { color: theme.text }]}>Total Leads</Text>
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{leads.length}</Text>
                <View style={styles.statBreakdown}>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    New: {leadStats.new}
                  </Text>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Completed: {leadStats.completed}
                  </Text>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Conversion: {leads.length > 0 ? ((leadStats.completed / leads.length) * 100).toFixed(1) : '0'}%
                  </Text>
                </View>
              </AnimatedCard>
            </View>
          </View>
        </SlideInView>

        {/* Lead Search Bar */}
        <View style={{ marginTop: 24, marginBottom: 8 }}>
          <TextInput
            style={{
              backgroundColor: '#F1F5F9',
              borderRadius: 8,
              padding: 10,
              fontSize: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              marginBottom: 8,
            }}
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>

        {/* Lead List */}
        <SlideInView delay={1200} duration={600} direction="up">
          <View style={styles.leadListContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Lead List</Text>
            {paginatedLeads.map(lead => (
              <TouchableOpacity
                key={lead.id}
                onPress={() => router.push({ pathname: '/(super_admin)/lead-info', params: { id: lead.id } })}
                style={{
                  backgroundColor: '#FFF',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <Text style={{ fontWeight: 'bold', color: '#1E293B', fontSize: 16 }}>{lead.customer_name}</Text>
                <Text style={{ color: '#64748B', fontSize: 14 }}>{lead.phone_number}</Text>
                <Text style={{ color: '#64748B', fontSize: 12 }}>{lead.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SlideInView>

        {/* Pagination Controls */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 16, gap: 12 }}>
          <TouchableOpacity
            style={{ padding: 8, borderRadius: 6, backgroundColor: currentPage === 1 ? '#E2E8F0' : '#1E40AF', marginHorizontal: 4, opacity: currentPage === 1 ? 0.5 : 1 }}
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(currentPage - 1)}
          >
            <Text style={{ color: currentPage === 1 ? '#64748B' : '#FFF', fontWeight: 'bold' }}>Previous</Text>
          </TouchableOpacity>
          <Text style={{ color: '#1E293B', fontWeight: 'bold', marginHorizontal: 8 }}>
            Page {currentPage} of {totalPages}
          </Text>
          <TouchableOpacity
            style={{ padding: 8, borderRadius: 6, backgroundColor: currentPage === totalPages ? '#E2E8F0' : '#1E40AF', marginHorizontal: 4, opacity: currentPage === totalPages ? 0.5 : 1 }}
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage(currentPage + 1)}
          >
            <Text style={{ color: currentPage === totalPages ? '#64748B' : '#FFF', fontWeight: 'bold' }}>Next</Text>
          </TouchableOpacity>
          <Text style={{ marginLeft: 16 }}>Page Size:</Text>
          <TextInput
            style={{ width: 60, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 4, marginLeft: 4, textAlign: 'center' }}
            keyboardType="numeric"
            value={pageSize.toString()}
            onChangeText={text => {
              const size = parseInt(text, 10);
              if (!isNaN(size) && size > 0) setPageSize(size);
            }}
          />
        </View>
      </ScrollView>

      {/* Bulk Import Modal */}
      <Modal
        visible={showBulkImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBulkImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bulk Import Leads</Text>
            <Text style={styles.modalSubtitle}>
              Upload a .csv file with columns: id, customer_name, phone_number, email, address, property_type, likelihood, status, salesman_id, salesman_name, call_operator_id, call_operator_name, technician_id, technician_name, call_notes, visit_notes, follow_up_date, created_at, updated_at
            </Text>
            
            <TouchableOpacity style={styles.uploadButton} onPress={handleFilePick}>
              <FileUp size={20} color={theme.primary} />
              <Text style={styles.uploadButtonText}>
                {fileName ? fileName : 'Select a .csv file'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBulkImportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, isImporting && { opacity: 0.7 }]}
                onPress={handleBulkImport}
                disabled={isImporting}
              >
                <Text style={styles.confirmButtonText}>
                  {isImporting ? 'Importing...' : 'Import'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    maxWidth: '80%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  kpiContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  grid2col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
  },
  kpiTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  kpiChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  kpiChangeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  actionsContainer: {
    marginTop: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 16,
  },
  actionCard: {
    width: 180,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginRight: 16,
    flexShrink: 0,
  },
  actionButton: {
    width: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  statBreakdown: {
    marginTop: 8,
  },
  statBreakdownText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  activityContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  activitySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#334155',
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  confirmButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  leadListContainer: {
    marginTop: 24,
  },
  quickActionsGridSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  } as ViewStyle,
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    width: '100%',
    marginBottom: 16,
  },
  actionCardBase: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 16,
  },
});
