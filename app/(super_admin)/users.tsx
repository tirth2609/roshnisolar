import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  UserX,
  TrendingUp,
  BarChart3,
  Clock,
  Target,
  CheckCircle,
  Activity,
  Eye,
  X,
  User
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { UserRole } from '@/types/auth';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const roleColors = {
  salesman: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  call_operator: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  technician: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  team_lead: { bg: '#F3E8FF', text: '#7C3AED', border: '#8B5CF6' },
  super_admin: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
};

export default function UsersManagementScreen() {
  const router = useRouter();
  const { 
    getAllUsers, 
    getActiveUsers,
    addUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus,
    getUserLeads,
    getUserTickets,
    getUserWorkStats,
    isLoading, 
    refreshData 
  } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'salesman' as UserRole,
  });

  const users = getAllUsers();

  const navigateToUserDetails = (id: string | number) => {
    router.push({ pathname: '/user/[id]', params: { id: String(id) } } as any);
  };
  const filteredUsers = users.filter(user => {
    if (!user || !user.name || !user.email) {
      return false;
    }
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleStats = () => {
    const activeUsers = getActiveUsers();
    return {
      total: users.length,
      active: activeUsers.length,
      inactive: users.length - activeUsers.length,
      salesman: activeUsers.filter(u => u.role === 'salesman').length,
      call_operator: activeUsers.filter(u => u.role === 'call_operator').length,
      technician: activeUsers.filter(u => u.role === 'technician').length,
      team_lead: activeUsers.filter(u => u.role === 'team_lead').length,
      super_admin: activeUsers.filter(u => u.role === 'super_admin').length,
    };
  };

  const stats = getRoleStats();

  const getDateRange = (period: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'daily':
        start.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        start.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
    }
    
    return { start, end: now };
  };

  const getUserWorkStatistics = (user: any, period: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    if (!user.is_active) {
      return {
        periodWork: 0,
        periodCompleted: 0,
        totalWork: 0,
        totalCompleted: 0,
        conversionRate: '0',
        periodConversionRate: '0'
      };
    }

    const { start, end } = getDateRange(period);
    const userLeads = getUserLeads(user.id);
    const workStats = getUserWorkStats(user.id);
    
    const periodLeads = userLeads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return leadDate >= start && leadDate <= end;
    });
    
    const periodUpdatedLeads = userLeads.filter(lead => {
      const leadDate = new Date(lead.updated_at);
      return leadDate >= start && leadDate <= end;
    });
    
    switch (user.role) {
      case 'salesman':
        const periodSalesLeads = periodLeads.filter(lead => lead.salesman_id === user.id);
        const completedSalesLeads = periodSalesLeads.filter(lead => lead.status === 'completed');
        const totalSalesLeads = userLeads.filter(lead => lead.salesman_id === user.id);
        const totalCompletedSales = totalSalesLeads.filter(lead => lead.status === 'completed');
        
        return {
          periodWork: periodSalesLeads.length,
          periodCompleted: completedSalesLeads.length,
          totalWork: totalSalesLeads.length,
          totalCompleted: totalCompletedSales.length,
          conversionRate: totalSalesLeads.length > 0 
            ? ((totalCompletedSales.length / totalSalesLeads.length) * 100).toFixed(1)
            : '0',
          periodConversionRate: periodSalesLeads.length > 0 
            ? ((completedSalesLeads.length / periodSalesLeads.length) * 100).toFixed(1)
            : '0'
        };
      
      case 'call_operator':
        const periodCallLeads = periodUpdatedLeads.filter(lead => lead.call_operator_id === user.id);
        const completedCallLeads = periodCallLeads.filter(lead => lead.status === 'completed');
        const totalCallLeads = userLeads.filter(lead => lead.call_operator_id === user.id);
        const totalCompletedCalls = totalCallLeads.filter(lead => lead.status === 'completed');
        
        return {
          periodWork: periodCallLeads.length,
          periodCompleted: completedCallLeads.length,
          totalWork: totalCallLeads.length,
          totalCompleted: totalCompletedCalls.length,
          conversionRate: totalCallLeads.length > 0 
            ? ((totalCompletedCalls.length / totalCallLeads.length) * 100).toFixed(1)
            : '0',
          periodConversionRate: periodCallLeads.length > 0 
            ? ((completedCallLeads.length / periodCallLeads.length) * 100).toFixed(1)
            : '0'
        };
      
      case 'technician':
        const periodTechLeads = periodUpdatedLeads.filter(lead => lead.technician_id === user.id);
        const completedTechLeads = periodTechLeads.filter(lead => lead.status === 'completed');
        const totalTechLeads = userLeads.filter(lead => lead.technician_id === user.id);
        const totalCompletedTech = totalTechLeads.filter(lead => lead.status === 'completed');
        
        return {
          periodWork: periodTechLeads.length,
          periodCompleted: completedTechLeads.length,
          totalWork: totalTechLeads.length,
          totalCompleted: totalCompletedTech.length,
          conversionRate: totalTechLeads.length > 0 
            ? ((totalCompletedTech.length / totalTechLeads.length) * 100).toFixed(1)
            : '0',
          periodConversionRate: periodTechLeads.length > 0 
            ? ((completedTechLeads.length / periodTechLeads.length) * 100).toFixed(1)
            : '0'
        };
      
      case 'team_lead':
        const teamMembers = getActiveUsers().filter(u => u.role === 'call_operator');
        const periodManagedLeads = periodLeads.length;
        const totalManagedLeads = userLeads.length;
        
        return {
          periodWork: periodManagedLeads,
          periodCompleted: 0, // Team leads don't directly complete leads
          totalWork: totalManagedLeads,
          totalCompleted: 0,
          conversionRate: 'N/A',
          periodConversionRate: 'N/A',
          teamMembers: teamMembers.length
        };
      
      default:
        return {
          periodWork: 0,
          periodCompleted: 0,
          totalWork: 0,
          totalCompleted: 0,
          conversionRate: '0',
          periodConversionRate: '0'
        };
    }
  };

  const getWorkLabel = (role: UserRole, period: 'daily' | 'weekly' | 'monthly') => {
    switch (role) {
      case 'salesman':
        return 'Leads';
      case 'call_operator':
        return 'Calls';
      case 'technician':
        return 'Visits';
      case 'team_lead':
        return 'Managed';
      default:
        return 'Work';
    }
  };

  const getCompletedLabel = (role: UserRole) => {
    switch (role) {
      case 'salesman':
        return 'Converted';
      case 'call_operator':
        return 'Completed';
      case 'technician':
        return 'Completed';
      case 'team_lead':
        return 'Team Size';
      default:
        return 'Completed';
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.phone || !newUser.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addUser(newUser);
      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'salesman',
      });
      Alert.alert('Success', 'User added successfully!');
    } catch (error) {
      // Error is already handled in the DataContext
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      await updateUser(selectedUser.id, selectedUser);
      setShowEditModal(false);
      setSelectedUser(null);
      Alert.alert('Success', 'User updated successfully!');
    } catch (error) {
      // Error is already handled in the DataContext
    }
  };

  // users.tsx
// ... (all other imports and code remain the same)

const handleDeleteUser = (user: any) => {
    // Get leads and tickets for the user to be deleted
    const userLeads = getUserLeads(user.id);
    const userTickets = getUserTickets(user.id);

    if (userLeads.length > 0 || userTickets.length > 0) {
        Alert.alert(
            'User Has Assigned Work',
            `${user.name} has ${userLeads.length} assigned leads and ${userTickets.length} assigned tickets.\n\nWould you like to reassign their work to another user before deletion?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reassign & Delete',
                    style: 'destructive',
                    onPress: () => openReassignModal(user),
                },
            ]
        );
    } else {
        confirmDeleteUser(user);
    }
};

const confirmDeleteUser = (user: any, reassignToUserId?: string) => {
    Alert.alert(
        'Delete User',
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
        [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteUser(user.id, reassignToUserId);
                    } catch (error) {
                        // Error is handled by the DataContext
                    }
                },
            },
        ]
    );
};


const handleReassignAndDelete = async (reassignToUserId: string) => {
    if (!selectedUser) return;
    try {
        await deleteUser(selectedUser.id, reassignToUserId);
        setShowReassignModal(false);
        setSelectedUser(null);
        Alert.alert('Success', 'User deleted and work reassigned successfully!');
    } catch (error) {
        // Error is already handled in the DataContext
    }
};

// ... (rest of the component and JSX remain the same)
  
  const openReassignModal = (user: any) => {
    // Find suitable users for reassignment based on role
    const suitableUsers = getActiveUsers().filter(u => 
      u.id !== user.id && 
      u.is_active && 
      (u.role === user.role || 
       (user.role === 'call_operator' && u.role === 'call_operator') ||
       (user.role === 'technician' && u.role === 'technician') ||
       (user.role === 'salesman' && u.role === 'salesman'))
    );

    if (suitableUsers.length === 0) {
      Alert.alert(
        'No Suitable Users',
        'No active users found with the same role for reassignment. Please manually reassign the work first.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Show user selection modal
    setSelectedUser(user);
    setShowReassignModal(true);
  };


  const handleToggleUserStatus = async (user: any) => {
    try {
      await toggleUserStatus(user.id, user.is_active);
      Alert.alert('Success', `User ${user.is_active ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      // Error is already handled in the DataContext
    }
  };

  const RoleBadge = ({ role }: { role: UserRole }) => {
    const colors = roleColors[role];
    return (
      <View style={[styles.roleBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <Text style={[styles.roleText, { color: colors.text }]}>
          {role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1)}
        </Text>
      </View>
    );
  };

  const UserCard = ({ user }: { user: any }) => {
    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => navigateToUserDetails(user.id)}
      >
        <View style={styles.userHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user.name.split(' ').map((n: string) => n[0]).join('')}
            </Text>
          </View>
          <View style={[
            styles.statusDot, 
            { backgroundColor: user.is_active ? '#10B981' : '#EF4444' }
          ]} />
        </View>

        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          <RoleBadge role={user.role} />
        </View>
        
        <View style={styles.userContact}>
          <View style={styles.contactRow}>
            <Mail size={14} color="#64748B" />
            <Text style={styles.contactText}>{user.email}</Text>
          </View>
          <View style={styles.contactRow}>
            <Phone size={14} color="#64748B" />
            <Text style={styles.contactText}>{user.phone}</Text>
          </View>
        </View>

        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleUserStatus(user)}
          >
            {user.is_active ? (
              <UserX size={16} color="#F59E0B" />
            ) : (
              <UserCheck size={16} color="#10B981" />
            )}
            <Text style={[styles.actionButtonText, { 
              color: user.is_active ? '#F59E0B' : '#10B981' 
            }]}>
              {user.is_active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedUser(user);
              setShowEditModal(true);
            }}
          >
            <Edit size={16} color="#3B82F6" />
            <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteUser(user)}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Users size={24} color="#FFFFFF" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>{stats.total} total users</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Users size={20} color="#7C3AED" />
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statCard}>
            <UserCheck size={20} color="#10B981" />
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <User size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.salesman}</Text>
            <Text style={styles.statLabel}>Salesmen</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color="#1E40AF" />
            <Text style={styles.statNumber}>{stats.call_operator}</Text>
            <Text style={styles.statLabel}>Operators</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Users size={20} color="#8B5CF6" />
            <Text style={styles.statNumber}>{stats.team_lead}</Text>
            <Text style={styles.statLabel}>Team Leads</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color="#10B981" />
            <Text style={styles.statNumber}>{stats.technician}</Text>
            <Text style={styles.statLabel}>Technicians</Text>
          </View>
          <View style={styles.statCard}>
            <Users size={20} color="#EF4444" />
            <Text style={styles.statNumber}>{stats.super_admin}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statCard}>
            <UserX size={20} color="#F59E0B" />
            <Text style={styles.statNumber}>{stats.total - stats.active}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, selectedRole === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedRole('all')}
          >
            <Text style={[styles.filterText, selectedRole === 'all' && styles.filterTextActive]}>
              All ({stats.total})
            </Text>
          </TouchableOpacity>
          {Object.entries(roleColors).map(([role]) => {
            const count = users.filter(u => u.role === role).length;
            return (
              <TouchableOpacity
                key={role}
                style={[styles.filterButton, selectedRole === role && styles.filterButtonActive]}
                onPress={() => setSelectedRole(role as UserRole)}
              >
                <Text style={[styles.filterText, selectedRole === role && styles.filterTextActive]}>
                  {role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} />}
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Add your first user to get started'}
            </Text>
          </View>
        ) : (
          <View style={styles.usersGrid}>
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </View>
        )}
        
      </ScrollView>

      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New User</Text>
            
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                value={newUser.name}
                onChangeText={(text) => setNewUser({...newUser, name: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                value={newUser.email}
                onChangeText={(text) => setNewUser({...newUser, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Password *"
                value={newUser.password}
                onChangeText={(text) => setNewUser({...newUser, password: text})}
                secureTextEntry
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                value={newUser.phone}
                onChangeText={(text) => setNewUser({...newUser, phone: text})}
                keyboardType="phone-pad"
              />

              <Text style={styles.roleLabel}>Role</Text>
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
                <Picker
                  selectedValue={newUser.role}
                  onValueChange={(itemValue) => setNewUser({ ...newUser, role: itemValue as UserRole })}
                  style={{ height: 48 }}
                >
                  {Object.keys(roleColors).map((role) => (
                    <Picker.Item
                      key={role}
                      label={role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1)}
                      value={role}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleAddUser}
              >
                <Text style={styles.confirmButtonText}>Add User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit User</Text>
            
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                value={selectedUser?.name || ''}
                onChangeText={(text) => setSelectedUser({...selectedUser, name: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                value={selectedUser?.email || ''}
                onChangeText={(text) => setSelectedUser({...selectedUser, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                value={selectedUser?.phone || ''}
                onChangeText={(text) => setSelectedUser({...selectedUser, phone: text})}
                keyboardType="phone-pad"
              />

              {/* Password field for editing user password */}
              <TextInput
                style={styles.input}
                placeholder="Change Password (leave blank to keep current)"
                value={selectedUser?.password || ''}
                onChangeText={(text) => setSelectedUser({...selectedUser, password: text})}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.roleLabel}>Role</Text>
              <View style={{ backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }}>
                <Picker
                  selectedValue={selectedUser?.role}
                  onValueChange={(itemValue) => setSelectedUser({ ...selectedUser, role: itemValue as UserRole })}
                  style={{ height: 48 }}
                >
                  {Object.keys(roleColors).map((role) => (
                    <Picker.Item
                      key={role}
                      label={role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1)}
                      value={role}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleEditUser}
              >
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Details Modal */}
      <Modal
        visible={showUserDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>User Details</Text>
            
            {selectedUser && (
              <View style={styles.userDetailsContainer}>
                {/* User Header */}
                <View style={styles.userDetailsHeader}>
                  <View style={styles.userDetailsAvatar}>
                    <Text style={styles.userDetailsAvatarText}>
                      {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.userDetailsInfo}>
                    <Text style={styles.userDetailsName}>{selectedUser.name}</Text>
                    <RoleBadge role={selectedUser.role} />
                    <Text style={styles.userDetailsEmail}>{selectedUser.email}</Text>
                    <Text style={styles.userDetailsPhone}>{selectedUser.phone}</Text>
                  </View>
                </View>

                {/* Work Analytics Section */}
                <View style={styles.workAnalyticsSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Work Analytics</Text>
                    <TouchableOpacity
                      style={styles.analyticsButton}
                      onPress={() => {
                        setShowUserDetailsModal(false);
                        setShowAnalyticsModal(true);
                      }}
                    >
                      <BarChart3 size={16} color="#3B82F6" />
                      <Text style={styles.analyticsButtonText}>Detailed View</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Today's Performance */}
                  <View style={styles.performanceCard}>
                    <Text style={styles.performanceTitle}>Today's Performance</Text>
                    {(() => {
                      const workStats = getUserWorkStatistics(selectedUser, 'daily');
                      switch (selectedUser.role) {
                        case 'salesman':
                          return (
                            <View style={styles.workStatsBackground}>
                              <View style={styles.workStatsRow}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodWork}</Text>
                                  <Text style={styles.workStatLabel}>Leads Generated</Text>
                                </View>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodCompleted}</Text>
                                  <Text style={styles.workStatLabel}>Converted</Text>
                                </View>
                              </View>
                              <View style={styles.workStatsRowLast}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodConversionRate}%</Text>
                                  <Text style={styles.workStatLabel}>Today's Rate</Text>
                                </View>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.conversionRate}%</Text>
                                  <Text style={styles.workStatLabel}>Overall Rate</Text>
                                </View>
                              </View>
                            </View>
                          );
                        
                        case 'call_operator':
                          return (
                            <View style={styles.workStatsBackground}>
                              <View style={styles.workStatsRow}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodWork}</Text>
                                  <Text style={styles.workStatLabel}>Calls Made</Text>
                                </View>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodCompleted}</Text>
                                  <Text style={styles.workStatLabel}>Successful</Text>
                                </View>
                              </View>
                              <View style={styles.workStatsRowLast}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodConversionRate}%</Text>
                                  <Text style={styles.workStatLabel}>Success Rate</Text>
                                </View>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.conversionRate}%</Text>
                                  <Text style={styles.workStatLabel}>Overall Rate</Text>
                                </View>
                              </View>
                            </View>
                          );
                        
                        case 'technician':
                          return (
                            <View style={styles.workStatsBackground}>
                              <View style={styles.workStatsRow}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodWork}</Text>
                                  <Text style={styles.workStatLabel}>Site Visits</Text>
                                </View>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodCompleted}</Text>
                                  <Text style={styles.workStatLabel}>Completed</Text>
                                </View>
                              </View>
                              <View style={styles.workStatsRowLast}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodConversionRate}%</Text>
                                  <Text style={styles.workStatLabel}>Completion Rate</Text>
                                </View>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.conversionRate}%</Text>
                                  <Text style={styles.workStatLabel}>Overall Rate</Text>
                                </View>
                              </View>
                            </View>
                          );
                        
                        case 'team_lead':
                          return (
                            <View style={styles.workStatsBackground}>
                              <View style={styles.workStatsRow}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.teamMembers || 0}</Text>
                                  <Text style={styles.workStatLabel}>Team Members</Text>
                                </View>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.periodWork}</Text>
                                  <Text style={styles.workStatLabel}>Leads Managed</Text>
                                </View>
                              </View>
                              <View style={styles.workStatsRowLast}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>{workStats.totalWork}</Text>
                                  <Text style={styles.workStatLabel}>Total Managed</Text>
                                </View>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>-</Text>
                                  <Text style={styles.workStatLabel}>Team Performance</Text>
                                </View>
                              </View>
                            </View>
                          );
                        
                        default:
                          return (
                            <View style={styles.workStatsBackground}>
                              <View style={styles.workStatsRow}>
                                <View style={styles.workStatCard}>
                                  <Text style={styles.workStatNumber}>0</Text>
                                  <Text style={styles.workStatLabel}>No Data</Text>
                                </View>
                              </View>
                            </View>
                          );
                      }
                    })()}
                  </View>

                  {/* Weekly & Monthly Summary */}
                  <View style={styles.summarySection}>
                    <Text style={styles.summaryTitle}>Performance Summary</Text>
                    <View style={styles.summaryGrid}>
                      <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>This Week</Text>
                        <Text style={styles.summaryNumber}>
                          {getUserWorkStatistics(selectedUser, 'weekly').periodWork}
                        </Text>
                        <Text style={styles.summarySubtext}>
                          {getWorkLabel(selectedUser.role, 'weekly')}
                        </Text>
                      </View>
                      <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>This Month</Text>
                        <Text style={styles.summaryNumber}>
                          {getUserWorkStatistics(selectedUser, 'monthly').periodWork}
                        </Text>
                        <Text style={styles.summarySubtext}>
                          {getWorkLabel(selectedUser.role, 'monthly')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUserDetailsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        visible={showAnalyticsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Work Analytics</Text>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={() => setShowAnalyticsModal(false)}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedUser && (
                <View style={styles.analyticsContainer}>
                  {/* User Info Header */}
                  <View style={styles.analyticsUserHeader}>
                    <View style={styles.analyticsUserAvatar}>
                      <Text style={styles.analyticsUserAvatarText}>
                        {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.analyticsUserInfo}>
                      <Text style={styles.analyticsUserName}>{selectedUser.name}</Text>
                      <RoleBadge role={selectedUser.role} />
                      <Text style={styles.analyticsUserEmail}>{selectedUser.email}</Text>
                    </View>
                  </View>

                  {/* Period Tabs */}
                  <View style={styles.periodTabs}>
                    {(['daily', 'weekly', 'monthly'] as const).map((period) => {
                      const stats = getUserWorkStatistics(selectedUser, period);
                      const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month';
                      
                      return (
                        <View key={period} style={styles.periodTab}>
                          <Text style={styles.periodTabTitle}>{periodLabel}</Text>
                          
                          <View style={styles.periodStatsGrid}>
                            <View style={styles.periodStatCard}>
                              <Activity size={20} color="#F59E0B" />
                              <Text style={styles.periodStatNumber}>{stats.periodWork}</Text>
                              <Text style={styles.periodStatLabel}>{getWorkLabel(selectedUser.role, period)}</Text>
                            </View>
                            
                            <View style={styles.periodStatCard}>
                              <CheckCircle size={20} color="#10B981" />
                              <Text style={styles.periodStatNumber}>{stats.periodCompleted}</Text>
                              <Text style={styles.periodStatLabel}>{getCompletedLabel(selectedUser.role)}</Text>
                            </View>
                            
                            <View style={styles.periodStatCard}>
                              <Target size={20} color="#8B5CF6" />
                              <Text style={styles.periodStatNumber}>{stats.periodConversionRate}%</Text>
                              <Text style={styles.periodStatLabel}>{periodLabel}'s Rate</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Overall Statistics */}
                  <View style={styles.overallStatsSection}>
                    <Text style={styles.overallStatsTitle}>Overall Performance</Text>
                    <View style={styles.overallStatsGrid}>
                      <View style={styles.overallStatCard}>
                        <TrendingUp size={20} color="#EF4444" />
                        <Text style={styles.overallStatNumber}>
                          {getUserWorkStatistics(selectedUser, 'monthly').totalWork}
                        </Text>
                        <Text style={styles.overallStatLabel}>Total Work</Text>
                      </View>
                      
                      <View style={styles.overallStatCard}>
                        <CheckCircle size={20} color="#10B981" />
                        <Text style={styles.overallStatNumber}>
                          {getUserWorkStatistics(selectedUser, 'monthly').totalCompleted}
                        </Text>
                        <Text style={styles.overallStatLabel}>Total Completed</Text>
                      </View>
                      
                      <View style={styles.overallStatCard}>
                        <Target size={20} color="#8B5CF6" />
                        <Text style={styles.overallStatNumber}>
                          {getUserWorkStatistics(selectedUser, 'monthly').conversionRate}%
                        </Text>
                        <Text style={styles.overallStatLabel}>Overall Rate</Text>
                      </View>
                    </View>
                  </View>

                  {/* Role-specific Insights */}
                  <View style={styles.insightsSection}>
                    <Text style={styles.insightsTitle}>Performance Insights</Text>
                    {(() => {
                      const dailyStats = getUserWorkStatistics(selectedUser, 'daily');
                      const weeklyStats = getUserWorkStatistics(selectedUser, 'weekly');
                      const monthlyStats = getUserWorkStatistics(selectedUser, 'monthly');
                      
                      switch (selectedUser.role) {
                        case 'salesman':
                          return (
                            <View style={styles.insightsContent}>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodWork} leads generated today
                              </Text>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodCompleted} leads converted to customers today
                              </Text>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodConversionRate}% conversion rate today
                              </Text>
                              <Text style={styles.insightText}>
                                • {monthlyStats.totalWork} total leads in the last month
                              </Text>
                            </View>
                          );
                        
                        case 'call_operator':
                          return (
                            <View style={styles.insightsContent}>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodWork} calls made today
                              </Text>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodCompleted} calls resulted in conversions
                              </Text>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodConversionRate}% call success rate today
                              </Text>
                              <Text style={styles.insightText}>
                                • {monthlyStats.totalWork} total calls in the last month
                              </Text>
                            </View>
                          );
                        
                        case 'technician':
                          return (
                            <View style={styles.insightsContent}>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodWork} site visits today
                              </Text>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodCompleted} installations completed today
                              </Text>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodConversionRate}% completion rate today
                              </Text>
                              <Text style={styles.insightText}>
                                • {monthlyStats.totalWork} total visits in the last month
                              </Text>
                            </View>
                          );
                        
                        case 'team_lead':
                          return (
                            <View style={styles.insightsContent}>
                              <Text style={styles.insightText}>
                                • Managing {dailyStats.teamMembers} team members
                              </Text>
                              <Text style={styles.insightText}>
                                • {dailyStats.periodWork} leads managed today
                              </Text>
                              <Text style={styles.insightText}>
                                • {monthlyStats.totalWork} total leads managed this month
                              </Text>
                              <Text style={styles.insightText}>
                                • Team performance monitoring active
                              </Text>
                            </View>
                          );
                        
                        default:
                          return (
                            <View style={styles.insightsContent}>
                              <Text style={styles.insightText}>No specific insights available for this role.</Text>
                            </View>
                          );
                      }
                    })()}
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAnalyticsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reassign User Work Modal */}
      <Modal
        visible={showReassignModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReassignModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reassign User Work</Text>
              <TouchableOpacity
                style={styles.closeIconButton}
                onPress={() => setShowReassignModal(false)}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              {selectedUser ? `Select a user to reassign ${selectedUser.name}'s work to:` : ''}
            </Text>

            <ScrollView style={styles.reassignUserList}>
              {selectedUser && getActiveUsers()
                .filter(u => 
                  u.id !== selectedUser.id && 
                  u.is_active && 
                  (u.role === selectedUser.role || 
                   (selectedUser.role === 'call_operator' && u.role === 'call_operator') ||
                   (selectedUser.role === 'technician' && u.role === 'technician') ||
                   (selectedUser.role === 'salesman' && u.role === 'salesman'))
                )
                .map((reassignUser) => (
                  <TouchableOpacity
                    key={reassignUser.id}
                    style={styles.reassignUserItem}
                    onPress={() => handleReassignAndDelete(reassignUser.id)}
                  >
                    <View style={styles.reassignUserInfo}>
                      <View style={styles.reassignUserAvatar}>
                        <Text style={styles.reassignUserAvatarText}>
                          {reassignUser.name.split(' ').map((n: string) => n[0]).join('')}
                        </Text>
                      </View>
                      <View style={styles.reassignUserDetails}>
                        <Text style={styles.reassignUserName}>{reassignUser.name}</Text>
                        <Text style={styles.reassignUserRole}>{reassignUser.role.replace('_', ' ')}</Text>
                        <Text style={styles.reassignUserEmail}>{reassignUser.email}</Text>
                      </View>
                    </View>
                    <View style={styles.reassignUserAction}>
                      <Text style={styles.reassignUserActionText}>Select</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReassignModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statCard: {
    alignItems: 'center',
    width: '25%',
    marginBottom: 12
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center'
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
    shadowOpacity: 0.15,
    elevation: 3
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  usersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: (width - 60) / 2, // 20px padding * 2, 20px gap
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 0,
    right: 0
  },
  userDetails: {
    alignItems: 'flex-start',
    marginBottom: 12
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  userContact: {
    gap: 8,
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    flex: 1,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
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
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  roleSelector: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E293B',
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleOptionSelected: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  roleOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  roleOptionTextSelected: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  userDetailsContainer: {
    padding: 20,
  },
  userDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userDetailsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetailsAvatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  userDetailsInfo: {
    flex: 1,
  },
  userDetailsName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  userDetailsEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  userDetailsPhone: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  workAnalyticsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
  },
  analyticsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  analyticsButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  performanceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
  },
  workStatsBackground: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workStatsRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  workStatCard: {
    alignItems: 'center',
    flex: 1,
  },
  workStatIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  workStatContent: {
    alignItems: 'center',
  },
  workStatNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  workStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  closeButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeIconButton: {
    padding: 8,
  },
  analyticsContainer: {
    padding: 20,
  },
  analyticsUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analyticsUserAvatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  analyticsUserInfo: {
    flex: 1,
  },
  analyticsUserName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  analyticsUserEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  periodTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodTabTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  periodStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodStatCard: {
    alignItems: 'center',
    flex: 1,
  },
  periodStatNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  periodStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    textAlign: 'center',
  },
  overallStatsSection: {
    marginBottom: 20,
  },
  overallStatsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  overallStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overallStatCard: {
    alignItems: 'center',
    flex: 1,
  },
  reassignUserList: {
    maxHeight: 300,
    marginVertical: 16,
  },
  reassignUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reassignUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reassignUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reassignUserAvatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  reassignUserDetails: {
    flex: 1,
  },
  reassignUserName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 2,
  },
  reassignUserRole: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#7C3AED',
    marginBottom: 2,
  },
  reassignUserEmail: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  reassignUserAction: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reassignUserActionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  overallStatNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  overallStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  insightsSection: {
    marginTop: 20,
  },
  insightsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
  },
  insightsContent: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 8,
  },
  summarySection: {
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginBottom: 4,
  },
  summaryNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
});
