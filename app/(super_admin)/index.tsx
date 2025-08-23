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
  Eye,
  Plus,
  Search,
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

const { width, height } = Dimensions.get('window');

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { 
    leads, 
    supportTickets, 
    customers,
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
  const [showSearchBar, setShowSearchBar] = useState(false);

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
      team_lead: users.filter(u => u.role === 'team_lead').length,
      super_admin: users.filter(u => u.role === 'super_admin').length,
    };
  };

  const leadStats = getLeadsByStatus();
  const ticketStats = getTicketsByStatus();
  const userStats = getUsersByRole();

  // --- CSV Import/Export Logic ---
  const LEAD_IMPORT_COLUMNS = [
    'customer_name',
    'phone_number',
    'email',
    'address',
    'property_type',
    'likelihood',
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
        customer_name: lead.customer_name,
        phone_number: lead.phone_number,
        email: lead.email,
        address: lead.address,
        property_type: lead.property_type,
        likelihood: lead.likelihood,
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
      const row = LEAD_IMPORT_COLUMNS.map(col => {
        let val = lead[col as keyof typeof lead];
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
    return ['#1E40AF', '#3B82F6', '#60A5FA'] as const;
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
      case 'new': return Plus;
      case 'contacted': return Phone;
      case 'transit': return Wrench;
      case 'completed': return CheckCircle;
      case 'declined': return AlertTriangle;
      case 'hold': return Clock;
      default: return Clock;
    }
  };

  const kpiCards = [
    {
      title: 'Total Leads',
      value: leads.length.toString(),
      change: `+${Math.floor(Math.random() * 20) + 5}`,
      icon: Target,
      color: '#3B82F6',
      bgColor: '#EBF8FF',
      subtitle: 'Active leads in system'
    },
    {
      title: 'Conversion Rate',
      value: `${analytics.conversionRate}%`,
      change: '+2.1%',
      icon: TrendingUp,
      color: '#10B981',
      bgColor: '#F0FDF4',
      subtitle: 'Leads to customers'
    },
    {
      title: 'Active Users',
      value: analytics.activeUsers.toString(),
      change: '+5',
      icon: Users,
      color: '#8B5CF6',
      bgColor: '#F3E8FF',
      subtitle: 'Currently active'
    },
    {
      title: 'Support Tickets',
      value: supportTickets.length.toString(),
      change: '-3',
      icon: Headphones,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      subtitle: 'Open tickets'
    }
  ];

  const filteredLeads = leads.filter(lead =>
    lead.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.phone_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLeads.length / pageSize);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return <SkeletonLeadList count={4} />;
  }

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading dashboard...</Text>
      </View>
    );
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
                  {user.name}
                </Text>
                <Text style={[styles.userRole, { color: theme.textInverse }]}>
                  Super Administrator
                </Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  onPress={() => setShowSearchBar(!showSearchBar)}
                >
                  <Search size={20} color={theme.textInverse} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
                  onPress={() => router.push('/(super_admin)/profile')}
                >
                  <Settings size={20} color={theme.textInverse} />
                </TouchableOpacity>
              </View>
            </View>
            
            <SlideInView delay={200} duration={600} direction="up">
              <Text style={[styles.headerSubtitle, { color: theme.textInverse }]}>
                Manage your entire system with powerful tools and insights
              </Text>
            </SlideInView>
          </View>
        </FadeInView>
      </LinearGradient>

      {/* Search Bar */}
      {showSearchBar && (
        <FadeInView duration={300}>
          <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
            <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { 
                color: theme.text, 
                borderColor: theme.border,
                backgroundColor: theme.background 
              }]}
              placeholder="Search leads by name, phone, or address..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={[styles.clearSearchText, { color: theme.textSecondary }]}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </FadeInView>
      )}

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
            <View style={styles.grid2col}>
              {kpiCards.map((kpi, index) => (
                <AnimatedCard key={kpi.title} index={index} style={[styles.kpiCard, { backgroundColor: theme.surface }]}>
                  <View style={[styles.kpiIcon, { backgroundColor: kpi.bgColor }]}>
                    <kpi.icon size={24} color={kpi.color} />
                  </View>
                  <Text style={[styles.kpiValue, { color: theme.text }]}>{kpi.value}</Text>
                  <Text style={[styles.kpiTitle, { color: theme.textSecondary }]}>{kpi.title}</Text>
                  <Text style={[styles.kpiSubtitle, { color: theme.textSecondary }]}>{kpi.subtitle}</Text>
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
            <View style={styles.grid2col}>
              <AnimatedCard index={0} style={styles.actionCard}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/(super_admin)/users')}
                >
                  <UserPlus size={24} color={theme.textInverse} />
                  <Text style={[styles.actionText, { color: theme.textInverse }]}>Manage Users</Text>
                </TouchableOpacity>
              </AnimatedCard>

              <AnimatedCard index={1} style={styles.actionCard}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.success }]}
                  onPress={() => setShowBulkImportModal(true)}
                >
                  <Upload size={24} color={theme.textInverse} />
                  <Text style={[styles.actionText, { color: theme.textInverse }]}>Bulk Import</Text>
                </TouchableOpacity>
              </AnimatedCard>

              <AnimatedCard index={2} style={styles.actionCard}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.warning }]}
                  onPress={() => router.push('/(super_admin)/lead-assignment')}
                >
                  <Target size={24} color={theme.textInverse} />
                  <Text style={[styles.actionText, { color: theme.textInverse }]}>Lead Assignment</Text>
                </TouchableOpacity>
              </AnimatedCard>

              <AnimatedCard index={3} style={styles.actionCard}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.info }]}
                  onPress={() => router.push('/(super_admin)/work-tracking')}
                >
                  <BarChart3 size={24} color={theme.textInverse} />
                  <Text style={[styles.actionText, { color: theme.textInverse }]}>Analytics</Text>
                </TouchableOpacity>
              </AnimatedCard>

              <AnimatedCard index={4} style={styles.actionCard}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
                  onPress={exportLeadsToCSV}
                >
                  <Download size={24} color={theme.textInverse} />
                  <Text style={[styles.actionText, { color: theme.textInverse }]}>Export Leads</Text>
                </TouchableOpacity>
              </AnimatedCard>

              <AnimatedCard index={5} style={styles.actionCard}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
                  onPress={() => router.push('/(super_admin)/customers')}
                >
                  <Crown size={24} color={theme.textInverse} />
                  <Text style={[styles.actionText, { color: theme.textInverse }]}>Customers</Text>
                </TouchableOpacity>
              </AnimatedCard>
            </View>
          </View>
        </SlideInView>

        {/* Statistics Overview - 2 column grid */}
        <SlideInView delay={800} duration={600} direction="up">
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>System Overview</Text>
            <View style={styles.grid2col}>
              <AnimatedCard index={4} style={[styles.statCard, { backgroundColor: theme.surface }]}>
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
                  <Text style={[styles.statBreakdownText, { color: theme.textSecondary }]}>
                    Team Leads: {userStats.team_lead}
                  </Text>
                </View>
              </AnimatedCard>

              <AnimatedCard index={5} style={[styles.statCard, { backgroundColor: theme.surface }]}>
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

        {/* Lead Status Distribution */}
        <SlideInView delay={1000} duration={600} direction="up">
          <View style={styles.statusContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Lead Status Distribution</Text>
            <View style={styles.statusGrid}>
              {Object.entries(leadStats).map(([status, count], index) => {
                const StatusIcon = getStatusIcon(status);
                const statusColor = getStatusColor(status);
                const percentage = leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : '0';
                
                return (
                  <AnimatedCard key={status} index={index} style={[styles.statusCard, { backgroundColor: theme.surface }]}>
                    <View style={[styles.statusIcon, { backgroundColor: `${statusColor}20` }]}>
                      <StatusIcon size={20} color={statusColor} />
                    </View>
                    <Text style={[styles.statusValue, { color: theme.text }]}>{count}</Text>
                    <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                    <Text style={[styles.statusPercentage, { color: statusColor }]}>{percentage}%</Text>
                  </AnimatedCard>
                );
              })}
            </View>
          </View>
        </SlideInView>

        {/* Lead List */}
        <SlideInView delay={1200} duration={600} direction="up">
          <View style={styles.leadListContainer}>
            <View style={styles.leadListHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recent Leads ({filteredLeads.length})
              </Text>
                              <TouchableOpacity
                  style={[styles.viewAllButton, { backgroundColor: theme.primary }]}
                  onPress={() => router.push('/(super_admin)/lead-assignment')}
                >
                  <Text style={[styles.viewAllButtonText, { color: theme.textInverse }]}>View All</Text>
                </TouchableOpacity>
            </View>
            
            {paginatedLeads.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                <Target size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  {searchQuery ? 'No leads match your search' : 'No leads found'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={[styles.addLeadButton, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/create-lead')}
                  >
                    <Plus size={16} color={theme.textInverse} />
                    <Text style={[styles.addLeadButtonText, { color: theme.textInverse }]}>Add First Lead</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              paginatedLeads.map((lead, index) => {
                const StatusIcon = getStatusIcon(lead.status);
                const statusColor = getStatusColor(lead.status);
                
                return (
                  <AnimatedCard key={lead.id} index={index} style={[styles.leadCard, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/(super_admin)/lead-info', params: { id: lead.id } })}
                      style={styles.leadCardContent}
                    >
                      <View style={styles.leadInfo}>
                        <View style={styles.leadHeader}>
                          <Text style={[styles.leadName, { color: theme.text }]}>{lead.customer_name}</Text>
                          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                            <StatusIcon size={12} color={statusColor} />
                            <Text style={[styles.statusText, { color: statusColor }]}>
                              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.leadPhone, { color: theme.textSecondary }]}>{lead.phone_number}</Text>
                        {lead.address && (
                          <Text style={[styles.leadAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                            {lead.address}
                          </Text>
                        )}
                        <View style={styles.leadMeta}>
                          {lead.salesman_name && (
                            <Text style={[styles.leadMetaText, { color: theme.textSecondary }]}>
                              Salesman: {lead.salesman_name}
                            </Text>
                          )}
                          {lead.created_at && (
                            <Text style={[styles.leadMetaText, { color: theme.textSecondary }]}>
                              Created: {new Date(lead.created_at).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.leadActions}>
                        <TouchableOpacity
                          style={[styles.viewButton, { backgroundColor: theme.primary }]}
                          onPress={() => router.push({ pathname: '/(super_admin)/lead-info', params: { id: lead.id } })}
                        >
                          <Eye size={16} color={theme.textInverse} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </AnimatedCard>
                );
              })
            )}
          </View>
        </SlideInView>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <SlideInView delay={1400} duration={600} direction="up">
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[
                  styles.paginationButton, 
                  { 
                    backgroundColor: currentPage === 1 ? theme.border : theme.primary,
                    opacity: currentPage === 1 ? 0.5 : 1 
                  }
                ]}
                disabled={currentPage === 1}
                onPress={() => setCurrentPage(currentPage - 1)}
              >
                <Text style={[
                  styles.paginationButtonText, 
                  { color: currentPage === 1 ? theme.textSecondary : theme.textInverse }
                ]}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.paginationInfo, { color: theme.text }]}>
                Page {currentPage} of {totalPages}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.paginationButton, 
                  { 
                    backgroundColor: currentPage === totalPages ? theme.border : theme.primary,
                    opacity: currentPage === totalPages ? 0.5 : 1 
                  }
                ]}
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage(currentPage + 1)}
              >
                <Text style={[
                  styles.paginationButtonText, 
                  { color: currentPage === totalPages ? theme.textSecondary : theme.textInverse }
                ]}>
                  Next
                </Text>
              </TouchableOpacity>
              
              <View style={styles.pageSizeContainer}>
                <Text style={[styles.pageSizeLabel, { color: theme.textSecondary }]}>Page Size:</Text>
                <TextInput
                  style={[
                    styles.pageSizeInput, 
                    { 
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      color: theme.text 
                    }
                  ]}
                  keyboardType="numeric"
                  value={pageSize.toString()}
                  onChangeText={text => {
                    const size = parseInt(text, 10);
                    if (!isNaN(size) && size > 0) setPageSize(size);
                  }}
                />
              </View>
            </View>
          </SlideInView>
        )}
      </ScrollView>

      {/* Bulk Import Modal */}
      <Modal
        visible={showBulkImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBulkImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Bulk Import Leads</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Upload a .csv file with columns: customer_name, phone_number, email, address, property_type, likelihood
            </Text>
            
            <TouchableOpacity 
              style={[styles.uploadButton, { borderColor: theme.border }]} 
              onPress={handleFilePick}
            >
              <FileUp size={20} color={theme.primary} />
              <Text style={[styles.uploadButtonText, { color: theme.text }]}>
                {fileName ? fileName : 'Select a .csv file'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => setShowBulkImportModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton, 
                  { backgroundColor: isImporting ? theme.border : theme.primary },
                  isImporting && { opacity: 0.7 }
                ]}
                onPress={handleBulkImport}
                disabled={isImporting}
              >
                <Text style={[
                  styles.confirmButtonText, 
                  { color: isImporting ? theme.textSecondary : theme.textInverse }
                ]}>
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
  userRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
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
  },
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
  kpiSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
  actionCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionButton: {
    width: (width - 40) / 4 - 12,
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusContainer: {
    marginTop: 24,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  statusPercentage: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  leadListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 16,
  },
  addLeadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  addLeadButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  leadCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leadCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadInfo: {
    flex: 1,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  leadName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  leadPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  leadAddress: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  leadMeta: {
    marginTop: 8,
  },
  leadMetaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  leadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  paginationButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  paginationButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  paginationInfo: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  pageSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageSizeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  pageSizeInput: {
    width: 60,
    borderRadius: 8,
    padding: 4,
    marginLeft: 4,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  clearSearchButton: {
    paddingHorizontal: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});