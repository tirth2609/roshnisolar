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
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  X
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
  const {
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getUserLeads,
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'salesman' as UserRole,
  });

  const users = getAllUsers();
  const filteredUsers = users.filter(user => {
    if (!user || !user.name || !user.email) {
      return false;
    }
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (user.phone && user.phone.includes(searchQuery));
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleStats = () => {
    return {
      total: users.length,
      salesman: users.filter(u => u.role === 'salesman').length,
      call_operator: users.filter(u => u.role === 'call_operator').length,
      technician: users.filter(u => u.role === 'technician').length,
      team_lead: users.filter(u => u.role === 'team_lead').length,
      super_admin: users.filter(u => u.role === 'super_admin').length,
      active: users.filter(u => u.is_active).length,
    };
  };

  const stats = getRoleStats();

  const getDateRange = (period: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const start = new Date();

    start.setHours(0, 0, 0, 0);

    switch (period) {
      case 'daily':
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
    const { start, end } = getDateRange(period);
    const userLeads = getUserLeads(user.id);

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
        const convertedCallLeads = periodCallLeads.filter(lead => lead.status === 'completed');
        const totalCallLeads = userLeads.filter(lead => lead.call_operator_id === user.id);
        const totalConvertedCalls = totalCallLeads.filter(lead => lead.status === 'completed');

        return {
          periodWork: periodCallLeads.length,
          periodCompleted: convertedCallLeads.length,
          totalWork: totalCallLeads.length,
          totalCompleted: totalConvertedCalls.length,
          conversionRate: totalCallLeads.length > 0
            ? ((totalConvertedCalls.length / totalCallLeads.length) * 100).toFixed(1)
            : '0',
          periodConversionRate: periodCallLeads.length > 0
            ? ((convertedCallLeads.length / periodCallLeads.length) * 100).toFixed(1)
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
        const teamMembers = users.filter(u => (u.role === 'call_operator' || u.role === 'technician') && u.is_active);
        const managedLeads = getUserLeads(user.id);
        const periodManagedLeads = managedLeads.filter(lead => {
            const leadDate = new Date(lead.created_at);
            return leadDate >= start && leadDate <= end;
        }).length;

        const totalManagedLeads = managedLeads.length;

        return {
          periodWork: periodManagedLeads,
          periodCompleted: 0,
          totalWork: totalManagedLeads,
          totalCompleted: 0,
          conversionRate: 'N/A',
          periodConversionRate: 'N/A',
          teamMembers: teamMembers.length
        };

      case 'super_admin':
        const adminLeads = userLeads.filter(lead => {
            const leadDate = new Date(lead.created_at);
            return leadDate >= start && leadDate <= end;
        });
        const adminCompleted = adminLeads.filter(lead => lead.status === 'completed').length;
        return {
          periodWork: adminLeads.length,
          periodCompleted: adminCompleted,
          totalWork: userLeads.length,
          totalCompleted: userLeads.filter(lead => lead.status === 'completed').length,
          conversionRate: userLeads.length > 0 ? ((userLeads.filter(lead => lead.status === 'completed').length / userLeads.length) * 100).toFixed(1) : '0',
          periodConversionRate: adminLeads.length > 0 ? ((adminCompleted / adminLeads.length) * 100).toFixed(1) : '0',
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
        return 'Leads Generated';
      case 'call_operator':
        return 'Calls Made';
      case 'technician':
        return 'Site Visits';
      case 'team_lead':
        return 'Managed Leads';
      case 'super_admin':
        return 'System Leads';
      default:
        return 'Work';
    }
  };

  const getCompletedLabel = (role: UserRole) => {
    switch (role) {
      case 'salesman':
        return 'Converted';
      case 'call_operator':
        return 'Converted';
      case 'technician':
        return 'Completed';
      case 'team_lead':
        return 'Team Size';
      case 'super_admin':
        return 'Converted';
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
      console.error('Error adding user in UI:', error);
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
      console.error('Error editing user in UI:', error);
    }
  };

  const handleDeleteUser = (userToDelete: any) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userToDelete.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userToDelete.id);
              await refreshData();
              Alert.alert('Success', 'User deleted successfully!');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to delete user.');
              console.error('Error deleting user in UI:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggleUserStatus = async (userToToggle: any) => {
    try {
      await toggleUserStatus(userToToggle.id, userToToggle.is_active);
      Alert.alert('Success', `User ${userToToggle.is_active ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      console.error('Error toggling user status in UI:', error);
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
        onPress={() => {
          setSelectedUser(user);
          setShowUserDetailsModal(true);
        }}
      >
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <RoleBadge role={user.role} />
            </View>
          </View>
          <View style={styles.userStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: user.is_active ? '#10B981' : '#EF4444' }
            ]} />
          </View>
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
          <View style={styles.contactRow}>
            <Calendar size={14} color="#64748B" />
            <Text style={styles.contactText}>
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </Text>
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

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} />}
      >
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
              <Phone size={20} color="#FF6B35" />
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
              placeholder="Search users by name, email, or phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#64748B"
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

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search criteria' : 'Add your first user to get started'}
            </Text>
          </View>
        ) : (
          <View style={styles.usersList}>
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
                onChangeText={(text) => setNewUser({ ...newUser, name: text })}
                placeholderTextColor="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                value={newUser.email}
                onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Password *"
                value={newUser.password}
                onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                value={newUser.phone}
                onChangeText={(text) => setNewUser({ ...newUser, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.roleLabel}>Role</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newUser.role}
                  onValueChange={(itemValue) => setNewUser({ ...newUser, role: itemValue as UserRole })}
                  style={styles.pickerStyle}
                  itemStyle={styles.pickerItemStyle}
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
                onChangeText={(text) => setSelectedUser({ ...selectedUser, name: text })}
                placeholderTextColor="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Email Address *"
                value={selectedUser?.email || ''}
                onChangeText={(text) => setSelectedUser({ ...selectedUser, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Phone Number *"
                value={selectedUser?.phone || ''}
                onChangeText={(text) => setSelectedUser({ ...selectedUser, phone: text })}
                keyboardType="phone-pad"
                placeholderTextColor="#64748B"
              />

              <TextInput
                style={styles.input}
                placeholder="Change Password (leave blank to keep current)"
                value={selectedUser?.password || ''}
                onChangeText={(text) => setSelectedUser({ ...selectedUser, password: text })}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.roleLabel}>Role</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedUser?.role}
                  onValueChange={(itemValue) => setSelectedUser({ ...selectedUser, role: itemValue as UserRole })}
                  style={styles.pickerStyle}
                  itemStyle={styles.pickerItemStyle}
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

      {/* User Details Modal (Laptop Web View Optimized) */}
      <Modal
        visible={showUserDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUserDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentWeb, { maxWidth: width * 0.7, minWidth: 700 }]}>
            {selectedUser && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderWeb}>
                  <Text style={styles.modalTitleWeb}>User Details</Text>
                  <TouchableOpacity
                    style={styles.closeIconButtonWeb}
                    onPress={() => setShowUserDetailsModal(false)}
                  >
                    <X size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.userDetailsSectionWeb}>
                  <View style={styles.userDetailsHeaderWeb}>
                    <View style={styles.userDetailsAvatarWeb}>
                      <Text style={styles.userDetailsAvatarText}>
                        {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.userDetailsInfoWeb}>
                      <Text style={styles.userDetailsNameWeb}>{selectedUser.name}</Text>
                      <RoleBadge role={selectedUser.role} />
                      <Text style={styles.userDetailsEmailWeb}>{selectedUser.email}</Text>
                      <Text style={styles.userDetailsPhoneWeb}>{selectedUser.phone}</Text>
                    </View>
                  </View>

                  <View style={styles.workAnalyticsSectionWeb}>
                    <View style={styles.sectionHeaderWeb}>
                      <Text style={styles.sectionTitleWeb}>Work Analytics</Text>
                      <TouchableOpacity
                        style={styles.analyticsButtonWeb}
                        onPress={() => {
                          setShowUserDetailsModal(false);
                          setShowAnalyticsModal(true);
                        }}
                      >
                        <BarChart3 size={16} color="#3B82F6" />
                        <Text style={styles.analyticsButtonTextWeb}>Detailed View</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.performanceCardWeb}>
                      <Text style={styles.performanceTitleWeb}>Today's Performance</Text>
                      {(() => {
                        const workStats = getUserWorkStatistics(selectedUser, 'daily');
                        switch (selectedUser.role) {
                          case 'salesman':
                            return (
                              <View style={styles.workStatsBackgroundWeb}>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodWork}</Text>
                                    <Text style={styles.workStatLabelWeb}>Leads Generated</Text>
                                  </View>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodCompleted}</Text>
                                    <Text style={styles.workStatLabelWeb}>Converted</Text>
                                  </View>
                                </View>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodConversionRate}%</Text>
                                    <Text style={styles.workStatLabelWeb}>Today's Rate</Text>
                                  </View>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.conversionRate}%</Text>
                                    <Text style={styles.workStatLabelWeb}>Overall Rate</Text>
                                  </View>
                                </View>
                              </View>
                            );

                          case 'call_operator':
                            return (
                              <View style={styles.workStatsBackgroundWeb}>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodWork}</Text>
                                    <Text style={styles.workStatLabelWeb}>Calls Made</Text>
                                  </View>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodCompleted}</Text>
                                    <Text style={styles.workStatLabelWeb}>Successful</Text>
                                  </View>
                                </View>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodConversionRate}%</Text>
                                    <Text style={styles.workStatLabelWeb}>Success Rate</Text>
                                  </View>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.conversionRate}%</Text>
                                    <Text style={styles.workStatLabelWeb}>Overall Rate</Text>
                                  </View>
                                </View>
                              </View>
                            );

                          case 'technician':
                            return (
                              <View style={styles.workStatsBackgroundWeb}>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodWork}</Text>
                                    <Text style={styles.workStatLabelWeb}>Site Visits</Text>
                                  </View>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodCompleted}</Text>
                                    <Text style={styles.workStatLabelWeb}>Completed</Text>
                                  </View>
                                </View>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodConversionRate}%</Text>
                                    <Text style={styles.workStatLabelWeb}>Completion Rate</Text>
                                  </View>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.conversionRate}%</Text>
                                    <Text style={styles.workStatLabelWeb}>Overall Rate</Text>
                                  </View>
                                </View>
                              </View>
                            );

                          case 'team_lead':
                            return (
                              <View style={styles.workStatsBackgroundWeb}>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.teamMembers || 0}</Text>
                                    <Text style={styles.workStatLabelWeb}>Team Members</Text>
                                  </View>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.periodWork}</Text>
                                    <Text style={styles.workStatLabelWeb}>Leads Managed</Text>
                                  </View>
                                </View>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>{workStats.totalWork}</Text>
                                    <Text style={styles.workStatLabelWeb}>Total Managed</Text>
                                  </View>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>-</Text>
                                    <Text style={styles.workStatLabelWeb}>Team Performance</Text>
                                  </View>
                                </View>
                              </View>
                            );

                            case 'super_admin':
                                return (
                                  <View style={styles.workStatsBackgroundWeb}>
                                    <View style={styles.workStatsRowWeb}>
                                      <View style={styles.workStatCardWeb}>
                                        <Text style={styles.workStatNumberWeb}>{workStats.periodWork}</Text>
                                        <Text style={styles.workStatLabelWeb}>System Leads</Text>
                                      </View>
                                      <View style={styles.workStatCardWeb}>
                                        <Text style={styles.workStatNumberWeb}>{workStats.periodCompleted}</Text>
                                        <Text style={styles.workStatLabelWeb}>Converted</Text>
                                      </View>
                                    </View>
                                    <View style={styles.workStatsRowWeb}>
                                      <View style={styles.workStatCardWeb}>
                                        <Text style={styles.workStatNumberWeb}>{workStats.periodConversionRate}%</Text>
                                        <Text style={styles.workStatLabelWeb}>Conversion Rate</Text>
                                      </View>
                                      <View style={styles.workStatCardWeb}>
                                        <Text style={styles.workStatNumberWeb}>{workStats.conversionRate}%</Text>
                                        <Text style={styles.workStatLabelWeb}>Overall Rate</Text>
                                      </View>
                                    </View>
                                  </View>
                                );

                          default:
                            return (
                              <View style={styles.workStatsBackgroundWeb}>
                                <View style={styles.workStatsRowWeb}>
                                  <View style={styles.workStatCardWeb}>
                                    <Text style={styles.workStatNumberWeb}>0</Text>
                                    <Text style={styles.workStatLabelWeb}>No Data</Text>
                                  </View>
                                </View>
                              </View>
                            );
                        }
                      })()}
                    </View>

                    <View style={styles.summarySectionWeb}>
                      <Text style={styles.summaryTitleWeb}>Performance Summary</Text>
                      <View style={styles.summaryGridWeb}>
                        <View style={styles.summaryCardWeb}>
                          <Text style={styles.summaryLabelWeb}>This Week</Text>
                          <Text style={styles.summaryNumberWeb}>
                            {getUserWorkStatistics(selectedUser, 'weekly').periodWork}
                          </Text>
                          <Text style={styles.summarySubtextWeb}>
                            {getWorkLabel(selectedUser.role, 'weekly')}
                          </Text>
                        </View>
                        <View style={styles.summaryCardWeb}>
                          <Text style={styles.summaryLabelWeb}>This Month</Text>
                          <Text style={styles.summaryNumberWeb}>
                            {getUserWorkStatistics(selectedUser, 'monthly').periodWork}
                          </Text>
                          <Text style={styles.summarySubtextWeb}>
                            {getWorkLabel(selectedUser.role, 'monthly')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeButtonWeb}
              onPress={() => setShowUserDetailsModal(false)}
            >
              <Text style={styles.closeButtonTextWeb}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Analytics Modal (Laptop Web View Optimized) */}
      <Modal
        visible={showAnalyticsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnalyticsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentWeb, { maxWidth: width * 0.7, minWidth: 700 }]}>
            <View style={styles.modalHeaderWeb}>
              <Text style={styles.modalTitleWeb}>Work Analytics</Text>
              <TouchableOpacity
                style={styles.closeIconButtonWeb}
                onPress={() => setShowAnalyticsModal(false)}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedUser && (
                <View style={styles.analyticsContainerWeb}>
                  <View style={styles.analyticsUserHeaderWeb}>
                    <View style={styles.analyticsUserAvatarWeb}>
                      <Text style={styles.analyticsUserAvatarText}>
                        {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                      </Text>
                    </View>
                    <View style={styles.analyticsUserInfoWeb}>
                      <Text style={styles.analyticsUserNameWeb}>{selectedUser.name}</Text>
                      <RoleBadge role={selectedUser.role} />
                      <Text style={styles.analyticsUserEmailWeb}>{selectedUser.email}</Text>
                    </View>
                  </View>

                  <View style={styles.periodTabsWeb}>
                    {(['daily', 'weekly', 'monthly'] as const).map((period) => {
                      const stats = getUserWorkStatistics(selectedUser, period);
                      const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month';

                      return (
                        <View key={period} style={styles.periodTabWeb}>
                          <Text style={styles.periodTabTitleWeb}>{periodLabel}</Text>

                          <View style={styles.periodStatsGridWeb}>
                            <View style={styles.periodStatCardWeb}>
                              <Activity size={20} color="#F59E0B" />
                              <Text style={styles.periodStatNumberWeb}>{stats.periodWork}</Text>
                              <Text style={styles.periodStatLabelWeb}>{getWorkLabel(selectedUser.role, period)}</Text>
                            </View>

                            <View style={styles.periodStatCardWeb}>
                              <CheckCircle size={20} color="#10B981" />
                              <Text style={styles.periodStatNumberWeb}>{stats.periodCompleted}</Text>
                              <Text style={styles.periodStatLabelWeb}>{getCompletedLabel(selectedUser.role)}</Text>
                            </View>

                            <View style={styles.periodStatCardWeb}>
                              <Target size={20} color="#8B5CF6" />
                              <Text style={styles.periodStatNumberWeb}>{stats.periodConversionRate}%</Text>
                              <Text style={styles.periodStatLabelWeb}>{periodLabel}'s Rate</Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.overallStatsSectionWeb}>
                    <Text style={styles.overallStatsTitleWeb}>Overall Performance</Text>
                    <View style={styles.overallStatsGridWeb}>
                      <View style={styles.overallStatCardWeb}>
                        <TrendingUp size={20} color="#EF4444" />
                        <Text style={styles.overallStatNumberWeb}>
                          {getUserWorkStatistics(selectedUser, 'monthly').totalWork}
                        </Text>
                        <Text style={styles.overallStatLabelWeb}>Total Work</Text>
                      </View>

                      <View style={styles.overallStatCardWeb}>
                        <CheckCircle size={20} color="#10B981" />
                        <Text style={styles.overallStatNumberWeb}>
                          {getUserWorkStatistics(selectedUser, 'monthly').totalCompleted}
                        </Text>
                        <Text style={styles.overallStatLabelWeb}>Total Completed</Text>
                      </View>

                      <View style={styles.overallStatCardWeb}>
                        <Target size={20} color="#8B5CF6" />
                        <Text style={styles.overallStatNumberWeb}>
                          {getUserWorkStatistics(selectedUser, 'monthly').conversionRate}%
                        </Text>
                        <Text style={styles.overallStatLabelWeb}>Overall Rate</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.insightsSectionWeb}>
                    <Text style={styles.insightsTitleWeb}>Performance Insights</Text>
                    {(() => {
                      const dailyStats = getUserWorkStatistics(selectedUser, 'daily');
                      const monthlyStats = getUserWorkStatistics(selectedUser, 'monthly');

                      switch (selectedUser.role) {
                        case 'salesman':
                          return (
                            <View style={styles.insightsContentWeb}>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodWork} leads generated today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodCompleted} leads converted to customers today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodConversionRate}% conversion rate today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {monthlyStats.totalWork} total leads in the last month
                              </Text>
                            </View>
                          );

                        case 'call_operator':
                          return (
                            <View style={styles.insightsContentWeb}>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodWork} calls made today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodCompleted} calls resulted in conversions
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodConversionRate}% call success rate today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {monthlyStats.totalWork} total calls in the last month
                              </Text>
                            </View>
                          );

                        case 'technician':
                          return (
                            <View style={styles.insightsContentWeb}>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodWork} site visits today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodCompleted} installations completed today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodConversionRate}% completion rate today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {monthlyStats.totalWork} total visits in the last month
                              </Text>
                            </View>
                          );

                        case 'team_lead':
                          return (
                            <View style={styles.insightsContentWeb}>
                              <Text style={styles.insightTextWeb}>
                                • Managing {dailyStats.teamMembers} team members
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {dailyStats.periodWork} leads managed today
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • {monthlyStats.totalWork} total leads managed this month
                              </Text>
                              <Text style={styles.insightTextWeb}>
                                • Team performance monitoring active
                              </Text>
                            </View>
                          );

                        case 'super_admin':
                            return (
                                <View style={styles.insightsContentWeb}>
                                    <Text style={styles.insightTextWeb}>
                                        • {dailyStats.periodWork} system leads generated today
                                    </Text>
                                    <Text style={styles.insightTextWeb}>
                                        • {dailyStats.periodCompleted} system leads converted today
                                    </Text>
                                    <Text style={styles.insightTextWeb}>
                                        • {dailyStats.periodConversionRate}% system conversion rate today
                                    </Text>
                                    <Text style={styles.insightTextWeb}>
                                        • {monthlyStats.totalWork} total system leads in the last month
                                    </Text>
                                </View>
                            );

                        default:
                          return (
                            <View style={styles.insightsContentWeb}>
                              <Text style={styles.insightTextWeb}>No specific insights available for this role.</Text>
                            </View>
                          );
                      }
                    })()}
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButtonWeb}
              onPress={() => setShowAnalyticsModal(false)}
            >
              <Text style={styles.closeButtonTextWeb}>Close</Text>
            </TouchableOpacity>
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainScrollView: {
    flex: 1,
  },
  mainScrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 0,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    marginVertical: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  searchContainer: {
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'normal',
    color: '#1E293B',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  usersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -6,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 6,
    width: (width / 2) - 32,
    minWidth: 280,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  userContact: {
    gap: 8,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#64748B',
    flex: 1,
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: 'normal',
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
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerStyle: {
    height: 48,
    width: '100%',
    color: '#1E293B',
  },
  pickerItemStyle: {
    fontSize: 16,
    color: '#1E293B',
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#FFFFFF',
  },

  modalContentWeb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeaderWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleWeb: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'left',
  },
  closeIconButtonWeb: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  userDetailsSectionWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    flex: 1,
  },
  userDetailsHeaderWeb: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F0F4F8',
    width: '35%',
    minWidth: 200,
  },
  userDetailsAvatarWeb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userDetailsAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetailsInfoWeb: {
    alignItems: 'center',
    flex: 1,
  },
  userDetailsNameWeb: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  userDetailsEmailWeb: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  userDetailsPhoneWeb: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  workAnalyticsSectionWeb: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeaderWeb: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleWeb: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  analyticsButtonWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  analyticsButtonTextWeb: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3B82F6',
  },
  performanceCardWeb: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  performanceTitleWeb: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  workStatsBackgroundWeb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workStatsRowWeb: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  workStatCardWeb: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
  },
  workStatNumberWeb: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  workStatLabelWeb: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  closeButtonWeb: {
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeButtonTextWeb: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  analyticsContainerWeb: {
    paddingTop: 10,
  },
  analyticsUserHeaderWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#F0F4F8',
    padding: 16,
    borderRadius: 12,
  },
  analyticsUserAvatarWeb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  analyticsUserAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  analyticsUserInfoWeb: {
    flex: 1,
  },
  analyticsUserNameWeb: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  analyticsUserEmailWeb: {
    fontSize: 15,
    fontWeight: 'normal',
    color: '#64748B',
  },
  periodTabsWeb: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  periodTabWeb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 0,
  },
  periodTabTitleWeb: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'left',
    marginBottom: 12,
  },
  periodStatsGridWeb: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  periodStatCardWeb: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
  },
  periodStatNumberWeb: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  periodStatLabelWeb: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  overallStatsSectionWeb: {
    marginBottom: 24,
  },
  overallStatsTitleWeb: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  overallStatsGridWeb: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  overallStatCardWeb: {
    alignItems: 'center',
    flex: 1,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  overallStatNumberWeb: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  overallStatLabelWeb: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  insightsSectionWeb: {
    marginTop: 24,
  },
  insightsTitleWeb: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  insightsContentWeb: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  insightTextWeb: {
    fontSize: 15,
    fontWeight: 'normal',
    color: '#64748B',
    marginBottom: 10,
  },
  summarySectionWeb: {
    marginTop: 24,
  },
  summaryTitleWeb: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryGridWeb: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  summaryCardWeb: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryLabelWeb: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
  },
  summaryNumberWeb: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  summarySubtextWeb: {
    fontSize: 13,
    fontWeight: 'normal',
    color: '#64748B',
  },
});
