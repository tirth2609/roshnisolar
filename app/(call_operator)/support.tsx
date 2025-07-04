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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Headphones, 
  Plus, 
  Phone, 
  Calendar, 
  TrendingUp, 
  Filter,
  AlertCircle,
  Clock,
  CheckCircle,
  User,
  ArrowRight
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { SupportTicket, NewTicketData, TicketStatus, TicketPriority } from '@/types/support';

const statusColors = {
  open: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  in_progress: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  resolved: { bg: '#DCFCE7', text: '#166534', border: '#22C55E' },
  closed: { bg: '#E5E7EB', text: '#374151', border: '#6B7280' },
};

const priorityColors = {
  low: '#64748B',
  medium: '#F59E0B',
  high: '#EF4444',
  urgent: '#DC2626',
};

export default function SupportScreen() {
  const { user } = useAuth();
  const { 
    getUserTickets, 
    addSupportTicket, 
    updateTicketStatus, 
    assignTicketToTechnician,
    getTechnicians,
    isLoading, 
    refreshData 
  } = useData();
  
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'all'>('open');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicketData, setNewTicketData] = useState<NewTicketData>({
    customer_id: '',
    customer_name: '',
    customer_phone: '',
    title: '',
    description: '',
    priority: 'medium',
  });
  const [statusNotes, setStatusNotes] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus>('in_progress');
  
  const myTickets = user ? getUserTickets(user.id) : [];
  const filteredTickets = selectedStatus === 'all' 
    ? myTickets 
    : myTickets.filter(ticket => ticket.status === selectedStatus);

  const technicians = getTechnicians();

  const getStatusCounts = () => {
    const counts = {
      total: myTickets.length,
      open: myTickets.filter(t => t.status === 'open').length,
      in_progress: myTickets.filter(t => t.status === 'in_progress').length,
      resolved: myTickets.filter(t => t.status === 'resolved').length,
    };
    return counts;
  };

  const counts = getStatusCounts();

  const handleCreateTicket = async () => {
    if (!newTicketData.customer_name || !newTicketData.title || !newTicketData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addSupportTicket({
        ...newTicketData,
        customer_id: Date.now().toString(), // Generate customer ID
      });
      setShowNewTicketModal(false);
      setNewTicketData({
        customer_id: '',
        customer_name: '',
        customer_phone: '',
        title: '',
        description: '',
        priority: 'medium',
      });
      Alert.alert('Success', 'Support ticket created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create support ticket');
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTicket) return;

    try {
      await updateTicketStatus(selectedTicket.id, newStatus, statusNotes);
      setShowStatusModal(false);
      setStatusNotes('');
      setSelectedTicket(null);
      Alert.alert('Success', 'Ticket status updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update ticket status');
    }
  };

  const handleAssignTechnician = async (technicianId: string) => {
    if (!selectedTicket) return;

    try {
      await assignTicketToTechnician(selectedTicket.id, technicianId);
      setShowTechnicianModal(false);
      setSelectedTicket(null);
      Alert.alert('Success', 'Ticket assigned to technician successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to assign technician');
    }
  };

  const StatusBadge = ({ status }: { status: TicketStatus }) => {
    const colors = statusColors[status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <Text style={[styles.statusText, { color: colors.text }]}>
          {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
        </Text>
      </View>
    );
  };

  const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
    <View style={[styles.priorityBadge, { backgroundColor: priorityColors[priority] }]}>
      <Text style={styles.priorityText}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Text>
    </View>
  );

  const TicketCard = ({ ticket }: { ticket: SupportTicket }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketTitle}>
          <Text style={styles.ticketTitleText} numberOfLines={1}>{ticket.title}</Text>
          <PriorityBadge priority={ticket.priority} />
        </View>
        <StatusBadge status={ticket.status} />
      </View>
      
      <View style={styles.ticketInfo}>
        <View style={styles.infoRow}>
          <User size={16} color="#64748B" />
          <Text style={styles.infoText}>{ticket.customer_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Phone size={16} color="#64748B" />
          <Text style={styles.infoText}>{ticket.customer_phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Calendar size={16} color="#64748B" />
          <Text style={styles.infoText}>
            {new Date(ticket.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <Text style={styles.ticketDescription} numberOfLines={2}>
        {ticket.description}
      </Text>

      {ticket.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{ticket.notes}</Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        {ticket.status === 'open' && !ticket.technician_id && (
          <TouchableOpacity
            style={styles.assignButton}
            onPress={() => {
              setSelectedTicket(ticket);
              setShowTechnicianModal(true);
            }}
          >
            <ArrowRight size={16} color="#10B981" />
            <Text style={styles.assignButtonText}>Assign</Text>
          </TouchableOpacity>
        )}

        {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
          <TouchableOpacity
            style={styles.updateButton}
            onPress={() => {
              setSelectedTicket(ticket);
              setShowStatusModal(true);
            }}
          >
            <CheckCircle size={16} color="#1E40AF" />
            <Text style={styles.updateButtonText}>Update</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10B981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Headphones size={24} color="#FFFFFF" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Support Center</Text>
            <Text style={styles.headerSubtitle}>{counts.total} active tickets</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewTicketModal(true)}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <TrendingUp size={20} color="#10B981" />
            <Text style={styles.statNumber}>{counts.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: statusColors.open.border }]} />
            <Text style={styles.statNumber}>{counts.open}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: statusColors.in_progress.border }]} />
            <Text style={styles.statNumber}>{counts.in_progress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statDot, { backgroundColor: statusColors.resolved.border }]} />
            <Text style={styles.statNumber}>{counts.resolved}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'open' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('open')}
          >
            <Text style={[styles.filterText, selectedStatus === 'open' && styles.filterTextActive]}>
              Open ({counts.open})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'in_progress' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('in_progress')}
          >
            <Text style={[styles.filterText, selectedStatus === 'in_progress' && styles.filterTextActive]}>
              In Progress ({counts.in_progress})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'resolved' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('resolved')}
          >
            <Text style={[styles.filterText, selectedStatus === 'resolved' && styles.filterTextActive]}>
              Resolved ({counts.resolved})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedStatus('all')}
          >
            <Text style={[styles.filterText, selectedStatus === 'all' && styles.filterTextActive]}>
              All ({counts.total})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} />}
      >
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Headphones size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus === 'all' 
                ? "No support tickets created yet" 
                : `No ${selectedStatus.replace('_', ' ')} tickets found`}
            </Text>
          </View>
        ) : (
          <View style={styles.ticketsList}>
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* New Ticket Modal */}
      <Modal
        visible={showNewTicketModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Support Ticket</Text>
            
            <ScrollView style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Customer Name *"
                value={newTicketData.customer_name}
                onChangeText={(text) => setNewTicketData({...newTicketData, customer_name: text})}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Customer Phone *"
                value={newTicketData.customer_phone}
                onChangeText={(text) => setNewTicketData({...newTicketData, customer_phone: text})}
                keyboardType="phone-pad"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Issue Title *"
                value={newTicketData.title}
                onChangeText={(text) => setNewTicketData({...newTicketData, title: text})}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Issue Description *"
                value={newTicketData.description}
                onChangeText={(text) => setNewTicketData({...newTicketData, description: text})}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.priorityLabel}>Priority</Text>
              <View style={styles.priorityOptions}>
                {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityOption,
                      newTicketData.priority === priority && styles.priorityOptionSelected,
                      { borderColor: priorityColors[priority] }
                    ]}
                    onPress={() => setNewTicketData({...newTicketData, priority})}
                  >
                    <Text style={[
                      styles.priorityOptionText,
                      newTicketData.priority === priority && { color: '#FFFFFF' }
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowNewTicketModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCreateTicket}
              >
                <Text style={styles.confirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Ticket Status</Text>
            
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[styles.statusOption, newStatus === 'in_progress' && styles.statusOptionSelected]}
                onPress={() => setNewStatus('in_progress')}
              >
                <Clock size={20} color={newStatus === 'in_progress' ? '#FFFFFF' : '#F59E0B'} />
                <Text style={[styles.statusOptionText, newStatus === 'in_progress' && styles.statusOptionTextSelected]}>
                  In Progress
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, newStatus === 'resolved' && styles.statusOptionSelected]}
                onPress={() => setNewStatus('resolved')}
              >
                <CheckCircle size={20} color={newStatus === 'resolved' ? '#FFFFFF' : '#10B981'} />
                <Text style={[styles.statusOptionText, newStatus === 'resolved' && styles.statusOptionTextSelected]}>
                  Resolved
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder="Add notes..."
              value={statusNotes}
              onChangeText={setStatusNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
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
                  </View>
                  <ArrowRight size={20} color="#64748B" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowTechnicianModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
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
  statsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
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
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
    marginTop: 4,
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
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
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
  ticketsList: {
    padding: 20,
    paddingTop: 0,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketTitle: {
    flex: 1,
    marginRight: 12,
  },
  ticketTitleText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  ticketInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    flex: 1,
  },
  ticketDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  notesContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  notesLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#475569',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  assignButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 6,
  },
  assignButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1E40AF',
    gap: 6,
  },
  updateButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1E40AF',
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
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: 400,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  priorityLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  priorityOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 2,
  },
  priorityOptionSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  priorityOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E293B',
  },
  statusOptions: {
    gap: 12,
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
    gap: 12,
  },
  statusOptionSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1E293B',
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
    backgroundColor: '#10B981',
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
});