import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Phone, 
  User, 
  Calendar,
  Eye,
  Search,
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DuplicateLeadLog } from '@/types/leads';
import { 
  FadeInView, 
  SlideInView, 
  AnimatedCard,
} from '@/components/AnimatedComponents';

const { width } = Dimensions.get('window');

export default function DuplicateLeadsScreen() {
  const { duplicateLeadLogs, fetchDuplicateLeadLogs } = useData();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDuplicateLeadLogs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDuplicateLeadLogs();
    } catch (error) {
      console.error('Error refreshing duplicate leads:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const showDuplicateLeadDetails = (log: DuplicateLeadLog) => {
    Alert.alert(
      'Duplicate Lead Details',
      `Attempted Lead:\n` +
      `• Customer: ${log.attempted_customer_name}\n` +
      `• Phone: ${log.attempted_phone_number}\n` +
      `• Attempted by: ${log.attempted_by_name} (${log.attempted_by_role})\n\n` +
      `Existing Lead:\n` +
      `• Customer: ${log.existing_lead_customer_name}\n` +
      `• Phone: ${log.existing_lead_phone_number}\n` +
      `• Status: ${log.existing_lead_status}\n` +
      `• Owner: ${log.existing_lead_owner_name} (${log.existing_lead_owner_role})\n\n` +
      `Attempt Date: ${new Date(log.created_at).toLocaleString()}`,
      [
        { text: 'View Existing Lead', onPress: () => {
          router.push({ pathname: '/(super_admin)/lead-info', params: { id: log.existing_lead_id } });
        }},
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  const filteredLogs = duplicateLeadLogs.filter(log => 
    log.attempted_customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.existing_lead_customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.attempted_phone_number.includes(searchQuery) ||
    log.existing_lead_phone_number.includes(searchQuery) ||
    log.attempted_by_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getGradientColors = () => {
    return ['#DC2626', '#EF4444'] as const;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={getGradientColors()} style={styles.header}>
        <FadeInView duration={600}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Duplicate Lead Attempts</Text>
              <Text style={styles.headerSubtitle}>
                Monitor and review duplicate lead creation attempts
              </Text>
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
        {/* Search Bar */}
        <FadeInView delay={200} duration={600}>
          <View style={styles.searchContainer}>
            <Search size={20} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { 
                color: theme.text, 
                borderColor: theme.border,
                backgroundColor: theme.surface 
              }]}
              placeholder="Search duplicate attempts..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </FadeInView>

        {/* Statistics */}
        <SlideInView delay={400} duration={600} direction="up">
          <View style={styles.statsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
            <View style={styles.statsGrid}>
              <AnimatedCard index={0} style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <AlertTriangle size={24} color="#F59E0B" />
                <Text style={[styles.statValue, { color: theme.text }]}>{duplicateLeadLogs.length}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Attempts</Text>
              </AnimatedCard>
              
              <AnimatedCard index={1} style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <User size={24} color="#3B82F6" />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {new Set(duplicateLeadLogs.map(log => log.attempted_by_id)).size}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Unique Users</Text>
              </AnimatedCard>
            </View>
          </View>
        </SlideInView>

        {/* Duplicate Lead Logs */}
        <SlideInView delay={600} duration={600} direction="up">
          <View style={styles.logsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Duplicate Attempts ({filteredLogs.length})
            </Text>
            
            {filteredLogs.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                <AlertTriangle size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  {searchQuery ? 'No duplicate attempts match your search' : 'No duplicate lead attempts found'}
                </Text>
              </View>
            ) : (
              filteredLogs.map((log, index) => (
                <AnimatedCard key={log.id} index={index} style={[styles.logCard, { 
                  backgroundColor: theme.surface,
                  borderColor: theme.border 
                }]}>
                  <TouchableOpacity onPress={() => showDuplicateLeadDetails(log)}>
                    <View style={styles.logHeader}>
                      <View style={styles.logIcon}>
                        <AlertTriangle size={20} color="#F59E0B" />
                      </View>
                      <View style={styles.logInfo}>
                        <Text style={[styles.logTitle, { color: theme.text }]}>
                          Duplicate Attempt: {log.attempted_customer_name}
                        </Text>
                        <Text style={[styles.logPhone, { color: theme.textSecondary }]}>
                          Phone: {log.attempted_phone_number}
                        </Text>
                        <Text style={[styles.logAttemptedBy, { color: theme.textSecondary }]}>
                          Attempted by: {log.attempted_by_name} ({log.attempted_by_role})
                        </Text>
                      </View>
                      <View style={styles.logActions}>
                        <Text style={[styles.logDate, { color: theme.textSecondary }]}>
                          {new Date(log.created_at).toLocaleDateString()}
                        </Text>
                        <TouchableOpacity
                          style={[styles.viewButton, { backgroundColor: theme.primary }]}
                          onPress={() => showDuplicateLeadDetails(log)}
                        >
                          <Eye size={16} color={theme.textInverse} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <View style={[styles.logDetails, { borderTopColor: theme.border }]}>
                      <Text style={[styles.logDetailText, { color: theme.textSecondary }]}>
                        Existing Lead: {log.existing_lead_customer_name} (Status: {log.existing_lead_status})
                      </Text>
                      <Text style={[styles.logDetailText, { color: theme.textSecondary }]}>
                        Owner: {log.existing_lead_owner_name} ({log.existing_lead_owner_role})
                      </Text>
                    </View>
                  </TouchableOpacity>
                </AnimatedCard>
              ))
            )}
          </View>
        </SlideInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginTop: 24,
    marginBottom: 16,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  logsContainer: {
    marginBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
    textAlign: 'center',
  },
  logCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  logPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  logAttemptedBy: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  logActions: {
    alignItems: 'flex-end',
  },
  logDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logDetails: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  logDetailText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
});

