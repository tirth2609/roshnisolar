import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  List, 
  Phone, 
  Headphones, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Users,
  Target
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

export default function MyWorkScreen() {
  const { user } = useAuth();
  const { getUserLeads, getUserTickets, isLoading, refreshData } = useData();
  
  const myLeads = user ? getUserLeads(user.id) : [];
  const myTickets = user ? getUserTickets(user.id) : [];

  const getWorkStats = () => {
    const today = new Date().toDateString();
    
    const todayLeads = myLeads.filter(lead => {
      const leadDate = new Date(lead.updated_at).toDateString();
      return leadDate === today && lead.call_operator_id === user?.id;
    });

    const todayTickets = myTickets.filter(ticket => {
      const ticketDate = new Date(ticket.updated_at).toDateString();
      return ticketDate === today;
    });

    const completedLeads = myLeads.filter(l => l.status === 'completed' && l.call_operator_id === user?.id);
    const resolvedTickets = myTickets.filter(t => t.status === 'resolved');

    return {
      todayLeads: todayLeads.length,
      todayTickets: todayTickets.length,
      totalLeads: myLeads.filter(l => l.call_operator_id === user?.id).length,
      totalTickets: myTickets.length,
      completedLeads: completedLeads.length,
      resolvedTickets: resolvedTickets.length,
      conversionRate: myLeads.length > 0 ? ((completedLeads.length / myLeads.filter(l => l.call_operator_id === user?.id).length) * 100).toFixed(1) : '0'
    };
  };

  const stats = getWorkStats();

  const recentActivity = [
    ...myLeads
      .filter(l => l.call_operator_id === user?.id)
      .slice(0, 3)
      .map(lead => ({
        id: lead.id,
        type: 'lead',
        title: `Called ${lead.customer_name}`,
        subtitle: `Status: ${lead.status}`,
        time: new Date(lead.updated_at).toLocaleTimeString(),
        icon: Phone,
        color: '#1E40AF'
      })),
    ...myTickets
      .slice(0, 2)
      .map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        subtitle: `Customer: ${ticket.customer_name}`,
        time: new Date(ticket.updated_at).toLocaleTimeString(),
        icon: Headphones,
        color: '#10B981'
      }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <List size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>My Work</Text>
            <Text style={styles.headerSubtitle}>Today's performance overview</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} />}
      >
        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#EBF8FF' }]}>
                <Phone size={20} color="#1E40AF" />
              </View>
              <Text style={styles.statNumber}>{stats.todayLeads}</Text>
              <Text style={styles.statLabel}>Leads Processed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                <Headphones size={20} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{stats.todayTickets}</Text>
              <Text style={styles.statLabel}>Tickets Handled</Text>
            </View>
          </View>
        </View>

        {/* Overall Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Performance</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Users size={20} color="#1E40AF" />
                <Text style={styles.performanceTitle}>Lead Management</Text>
              </View>
              <View style={styles.performanceStats}>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceNumber}>{stats.totalLeads}</Text>
                  <Text style={styles.performanceLabel}>Total Processed</Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceNumber}>{stats.completedLeads}</Text>
                  <Text style={styles.performanceLabel}>Completed</Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={[styles.performanceNumber, { color: '#10B981' }]}>{stats.conversionRate}%</Text>
                  <Text style={styles.performanceLabel}>Conversion</Text>
                </View>
              </View>
            </View>

            <View style={styles.performanceCard}>
              <View style={styles.performanceHeader}>
                <Target size={20} color="#10B981" />
                <Text style={styles.performanceTitle}>Support Tickets</Text>
              </View>
              <View style={styles.performanceStats}>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceNumber}>{stats.totalTickets}</Text>
                  <Text style={styles.performanceLabel}>Total Handled</Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={styles.performanceNumber}>{stats.resolvedTickets}</Text>
                  <Text style={styles.performanceLabel}>Resolved</Text>
                </View>
                <View style={styles.performanceStat}>
                  <Text style={[styles.performanceNumber, { color: '#10B981' }]}>
                    {stats.totalTickets > 0 ? ((stats.resolvedTickets / stats.totalTickets) * 100).toFixed(0) : '0'}%
                  </Text>
                  <Text style={styles.performanceLabel}>Resolution Rate</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.length === 0 ? (
              <View style={styles.emptyActivity}>
                <Clock size={48} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No recent activity</Text>
                <Text style={styles.emptySubtitle}>Your recent work will appear here</Text>
              </View>
            ) : (
              recentActivity.map((activity, index) => (
                <View key={`${activity.id}-${index}`} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
                    <activity.icon size={16} color={activity.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                  </View>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#EBF8FF' }]}>
                <Phone size={20} color="#1E40AF" />
              </View>
              <Text style={styles.quickActionText}>View New Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Headphones size={20} color="#10B981" />
              </View>
              <Text style={styles.quickActionText}>Create Support Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  performanceGrid: {
    gap: 12,
  },
  performanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  performanceTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceStat: {
    alignItems: 'center',
  },
  performanceNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94A3B8',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
});