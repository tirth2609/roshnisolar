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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BarChart3,
  Users,
  TrendingUp,
  Target,
  Zap,
  Upload,
  UserPlus,
  Menu,
  Settings,
  Download,
  FileUp,
  DollarSign,
  Search,
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import SkeletonLeadList from '../components/SkeletonLeadList';
import {
  FadeInView,
  SlideInView,
  AnimatedCard,
} from '@/components/AnimatedComponents';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ViewStyle } from 'react-native';

const { width } = Dimensions.get('window');

// Utility function to determine screen size categories
const getScreenSize = (width: number) => {
  if (width > 1200) return 'xl';
  if (width > 900) return 'lg';
  if (width > 600) return 'md';
  return 'sm';
};

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
  const screenSize = getScreenSize(width);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [leads, pageSize, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await fetchLeads();
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

  const getUsersByRole = () => {
    return {
      salesman: users.filter(u => u.role === 'salesman').length,
      call_operator: users.filter(u => u.role === 'call_operator').length,
      technician: users.filter(u => u.role === 'technician').length,
      super_admin: users.filter(u => u.role === 'super_admin').length,
    };
  };

  const leadStats = getLeadsByStatus();
  const userStats = getUsersByRole();

  // --- CSV Import/Export Logic ---
  const LEAD_IMPORT_COLUMNS = [
    'id', 'customer_name', 'phone_number', 'email', 'address', 'property_type', 'likelihood',
    'status', 'salesman_id', 'salesman_name', 'call_operator_id', 'call_operator_name',
    'technician_id', 'technician_name', 'call_notes', 'visit_notes', 'follow_up_date',
    'created_at', 'updated_at',
  ];

  const parseCSVData = (csvText: string) => {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leadsData = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;
      const lead: any = {};
      headers.forEach((header, idx) => {
        lead[header] = values[idx] || '';
      });
      leadsData.push(lead);
    }
    return leadsData;
  };

  const exportLeadsToCSV = async () => {
    if (!leads || leads.length === 0) {
      Alert.alert('No Data', 'No leads to export.');
      return;
    }
    const csvRows = [LEAD_IMPORT_COLUMNS.join(',')];
    for (const lead of leads) {
      const row = LEAD_IMPORT_COLUMNS.map(col => {
        let val = (lead as any)[col];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      csvRows.push(row.join(','));
    }
    const csvString = csvRows.join('\n');
    try {
      if (Platform.OS === 'web') {
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
        const file = asset.file;
        if (!file) throw new Error('File object not available on web.');
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result;
          if (typeof content === 'string') setCsvData(content);
          else Alert.alert('Error', 'Could not read file content.');
        };
        reader.onerror = () => Alert.alert('Error', 'Failed to read the file.');
        reader.readAsText(file);
      } else {
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

  const getGradientColors = () => ['#C02626', '#E24C4C', '#F76B6B'] as const;

  const kpiCards = [
    { title: 'Total Revenue', value: '₹45.2L', change: '+12.5%', icon: DollarSign, color: theme.success },
    { title: 'Conversion Rate', value: `${analytics.conversionRate}%`, change: '+2.1%', icon: Target, color: theme.info },
    { title: 'Active Users', value: analytics.activeUsers.toString(), change: '+5', icon: Users, color: theme.warning },
    { title: 'System Uptime', value: '99.9%', change: '+0.1%', icon: Zap, color: theme.primary },
  ];

  const filteredLeads = leads.filter(lead =>
    lead.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading || !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Your Internet is slow! Loading dashboard...</Text>
      </View>
    );
  }

  const kpiGridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  };

  const kpiCardWidth = () => {
    if (screenSize === 'xl') return '23%';
    if (screenSize === 'lg') return '23%';
    if (screenSize === 'md') return '48%';
    return '100%';
  };

  const quickActionsGridStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  };

  const actionCardWidth = () => {
    if (screenSize === 'xl') return '19%';
    if (screenSize === 'lg') return '19%';
    if (screenSize === 'md') return '31%';
    return '48%';
  };

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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View style={styles.spacer} />

        {/* KPI Cards */}
        <FadeInView delay={400} duration={600}>
          <View style={styles.kpiContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Performance Indicators</Text>
            <View style={kpiGridStyle}>
              {kpiCards.map((kpi, index) => (
                <AnimatedCard key={kpi.title} index={index} style={[styles.kpiCard, { width: kpiCardWidth() }]}>
                  <View style={styles.kpiHeader}>
                    <View style={[styles.kpiIcon, { backgroundColor: `${kpi.color}20` }]}>
                      <kpi.icon size={24} color={kpi.color} />
                    </View>
                    <Text style={[styles.kpiTitle, { color: theme.textSecondary }]}>{kpi.title}</Text>
                  </View>
                  <Text style={[styles.kpiValue, { color: theme.text }]}>{kpi.value}</Text>
                  <View style={styles.kpiChange}>
                    <TrendingUp size={12} color="#10B981" />
                    <Text style={styles.kpiChangeText}>{kpi.change}</Text>
                  </View>
                </AnimatedCard>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Quick Actions */}
        <SlideInView delay={600} duration={600} direction="up">
          <View style={styles.actionsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
            <View style={quickActionsGridStyle}>
              {[
                { title: 'Manage Users', icon: UserPlus, color: theme.primary, onPress: () => router.push('/(super_admin)/users') },
                { title: 'Bulk Import', icon: Upload, color: theme.success, onPress: () => setShowBulkImportModal(true) },
                { title: 'Lead Assignment', icon: Target, color: theme.warning, onPress: () => router.push('/(super_admin)/lead-assignment') },
                { title: 'Analytics', icon: BarChart3, color: theme.info, onPress: () => router.push('/(super_admin)/work-tracking') },
                { title: 'Export Leads', icon: Download, color: theme.info, onPress: exportLeadsToCSV },
              ].map((action, index) => (
                <AnimatedCard
                  key={action.title}
                  index={index}
                  style={[styles.actionCard, { width: actionCardWidth(), backgroundColor: theme.background }]}
                >
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={action.onPress}
                  >
                    <View style={[styles.actionIconContainer, { backgroundColor: `${action.color}20` }]}>
                      <action.icon size={24} color={action.color} />
                    </View>
                    <Text style={[styles.actionText, { color: theme.text }]}>{action.title}</Text>
                  </TouchableOpacity>
                </AnimatedCard>
              ))}
            </View>
          </View>
        </SlideInView>

        {/* Statistics Overview */}
        <SlideInView delay={800} duration={600} direction="up">
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>System Overview</Text>
            <View style={styles.grid2col}>
              <AnimatedCard index={0} style={[styles.statCard, { backgroundColor: theme.background }]}>
                <View style={styles.statHeader}>
                  <Users size={20} color={theme.primary} />
                  <Text style={[styles.statTitle, { color: theme.text }]}>Total Users</Text>
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{users.length}</Text>
                <View style={styles.statBreakdown}>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Salesmen: <Text style={{ fontWeight: 'bold' }}>{userStats.salesman}</Text>
                  </Text>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Operators: <Text style={{ fontWeight: 'bold' }}>{userStats.call_operator}</Text>
                  </Text>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Technicians: <Text style={{ fontWeight: 'bold' }}>{userStats.technician}</Text>
                  </Text>
                </View>
              </AnimatedCard>
              <AnimatedCard index={1} style={[styles.statCard, { backgroundColor: theme.background }]}>
                <View style={styles.statHeader}>
                  <Target size={20} color={theme.success} />
                  <Text style={[styles.statTitle, { color: theme.text }]}>Total Leads</Text>
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{leads.length}</Text>
                <View style={styles.statBreakdown}>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    New: <Text style={{ fontWeight: 'bold' }}>{leadStats.new}</Text>
                  </Text>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Completed: <Text style={{ fontWeight: 'bold' }}>{leadStats.completed}</Text>
                  </Text>
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Conversion: <Text style={{ fontWeight: 'bold' }}>{leads.length > 0 ? ((leadStats.completed / leads.length) * 100).toFixed(1) : '0'}%</Text>
                  </Text>
                </View>
              </AnimatedCard>
            </View>
          </View>
        </SlideInView>
        <View style={styles.spacer} />

        {/* Lead Search & List */}
        <SlideInView delay={1000} duration={600} direction="up">
          <View style={styles.leadListSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Lead List</Text>
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
              {paginatedLeads.map(lead => (
                <TouchableOpacity
                  key={lead.id}
                  onPress={() => router.push({ pathname: '/(super_admin)/lead-info', params: { id: lead.id } })}
                  style={[styles.leadListItem, { backgroundColor: theme.background, borderColor: theme.border }]}
                >
                  <View style={styles.leadInfo}>
                    <Text style={[styles.leadName, { color: theme.text }]}>{lead.customer_name}</Text>
                    <Text style={[styles.leadPhone, { color: theme.textSecondary }]}>{lead.phone_number}</Text>
                    <Text style={[styles.leadAddress, { color: theme.textSecondary }]}>{lead.address}</Text>
                  </View>
                  <View style={[styles.leadStatus, { backgroundColor: lead.status === 'completed' ? '#D1FAE5' : lead.status === 'new' ? '#FEF3C7' : '#E0E7FF' }]}>
                    <Text style={[styles.leadStatusText, { color: lead.status === 'completed' ? '#065F46' : lead.status === 'new' ? '#92400E' : '#1E40AF' }]}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            {/* Pagination Controls */}
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, { backgroundColor: currentPage === 1 ? theme.disabled : theme.primary }]}
                disabled={currentPage === 1}
                onPress={() => setCurrentPage(currentPage - 1)}
              >
                <Text style={styles.paginationButtonText}>Previous</Text>
              </TouchableOpacity>
              <Text style={[styles.paginationText, { color: theme.text }]}>
                Page {currentPage} of {totalPages || 1}
              </Text>
              <TouchableOpacity
                style={[styles.paginationButton, { backgroundColor: currentPage === totalPages ? theme.disabled : theme.primary }]}
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage(currentPage + 1)}
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
          </View>
        </SlideInView>
        <View style={styles.spacer} />
      </ScrollView>

      {/* Bulk Import Modal */}
      <Modal
        visible={showBulkImportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBulkImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Bulk Import Leads</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Please upload a `.csv` file. Ensure it contains the correct columns and data format.
            </Text>
            <TouchableOpacity style={[styles.uploadButton, { borderColor: theme.border }]} onPress={handleFilePick}>
              <FileUp size={24} color={theme.primary} />
              <Text style={[styles.uploadButtonText, { color: theme.text }]}>
                {fileName ? fileName : 'Select a .csv file'}
              </Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.background }]}
                onPress={() => setShowBulkImportModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.primary, opacity: isImporting ? 0.7 : 1 }]}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    gap: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  spacer: {
    height: 24,
  },
  kpiContainer: {},
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  kpiCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  kpiTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  kpiValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
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
    marginTop: 16,
  },
  actionCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  statsContainer: {
    marginTop: 16,
  },
  grid2col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  } as ViewStyle,
  statCard: {
    flexGrow: 1,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...Platform.select({
      web: {
        width: '48%',
      },
    }),
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
    lineHeight: 18,
  },
  leadListSection: {
    marginTop: 16,
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
  leadListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  leadPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  leadAddress: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  leadStatus: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  leadStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
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
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    marginBottom: 24,
  },
  uploadButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});