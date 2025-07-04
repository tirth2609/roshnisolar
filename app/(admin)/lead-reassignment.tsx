import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Users,
  Phone,
  Calendar,
  MapPin,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Lead } from '@/types/leads';

export default function LeadReassignmentScreen() {
  const { user } = useAuth();
  const { getUserLeads, getCallOperators, reassignLeadFromOperator, isLoading } = useData();
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showReassignmentModal, setShowReassignmentModal] = useState(false);
  const [targetOperatorId, setTargetOperatorId] = useState('');

  const operators = getCallOperators();
  const operatorLeads = selectedOperator ? getUserLeads(selectedOperator) : [];

  const handleReassignLead = async () => {
    if (!selectedLead || !targetOperatorId) {
      Alert.alert('Error', 'Please select a lead and target operator');
      return;
    }

    try {
      await reassignLeadFromOperator(
        selectedLead.id,
        selectedLead.call_operator_id || '',
        targetOperatorId
      );
      setShowReassignmentModal(false);
      setSelectedLead(null);
      setTargetOperatorId('');
      Alert.alert('Success', 'Lead reassigned successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to reassign lead');
    }
  };

  const LeadCard = ({ lead }: { lead: Lead }) => {
    return (
      <View style={styles.leadCard}>
        <View style={styles.leadHeader}>
          <Text style={styles.customerName}>{lead.customer_name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) }]}>
            <Text style={styles.statusText}>{lead.status}</Text>
          </View>
        </View>
        
        <View style={styles.leadInfo}>
          <View style={styles.infoRow}>
            <Phone size={16} color="#64748B" />
            <Text style={styles.infoText}>{lead.phone_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={16} color="#64748B" />
            <Text style={styles.infoText} numberOfLines={2}>{lead.address}</Text>
          </View>
          <View style={styles.infoRow}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.infoText}>
              {new Date(lead.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reassignButton}
          onPress={() => {
            setSelectedLead(lead);
            setShowReassignmentModal(true);
          }}
        >
          <ArrowRight size={16} color="#FFFFFF" />
          <Text style={styles.reassignButtonText}>Reassign</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: '#3B82F6',
      contacted: '#10B981',
      hold: '#F59E0B',
      transit: '#8B5CF6',
      completed: '#059669',
      declined: '#EF4444',
    };
    return colors[status as keyof typeof colors] || '#64748B';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E40AF', '#3B82F6']} style={styles.header}>
        <Text style={styles.headerTitle}>Lead Reassignment</Text>
        <Text style={styles.headerSubtitle}>Reassign leads between operators</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.operatorSelector}>
          <Text style={styles.sectionTitle}>Select Operator</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {operators.map((operator) => (
              <TouchableOpacity
                key={operator.id}
                style={[
                  styles.operatorButton,
                  selectedOperator === operator.id && styles.operatorButtonActive
                ]}
                onPress={() => setSelectedOperator(operator.id)}
              >
                <Users size={20} color={selectedOperator === operator.id ? '#FFFFFF' : '#1E40AF'} />
                <Text style={[
                  styles.operatorButtonText,
                  selectedOperator === operator.id && styles.operatorButtonTextActive
                ]}>
                  {operator.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedOperator && (
          <View style={styles.leadsSection}>
            <Text style={styles.sectionTitle}>
              Leads for {operators.find(o => o.id === selectedOperator)?.name} ({operatorLeads.length})
            </Text>
            <ScrollView style={styles.leadsList}>
              {operatorLeads.length > 0 ? (
                operatorLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No leads assigned to this operator</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Reassignment Modal */}
      <Modal
        visible={showReassignmentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReassignmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reassign Lead</Text>
            <Text style={styles.modalSubtitle}>
              Reassign "{selectedLead?.customer_name}" to:
            </Text>
            
            <ScrollView style={styles.operatorList}>
              {operators
                .filter(op => op.id !== selectedLead?.call_operator_id)
                .map((operator) => (
                  <TouchableOpacity
                    key={operator.id}
                    style={[
                      styles.operatorOption,
                      targetOperatorId === operator.id && styles.operatorOptionSelected
                    ]}
                    onPress={() => setTargetOperatorId(operator.id)}
                  >
                    <Users size={20} color={targetOperatorId === operator.id ? '#FFFFFF' : '#1E40AF'} />
                    <View style={styles.operatorInfo}>
                      <Text style={[
                        styles.operatorName,
                        targetOperatorId === operator.id && styles.operatorNameSelected
                      ]}>
                        {operator.name}
                      </Text>
                      <Text style={[
                        styles.operatorEmail,
                        targetOperatorId === operator.id && styles.operatorEmailSelected
                      ]}>
                        {operator.email}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowReassignmentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, !targetOperatorId && styles.confirmButtonDisabled]}
                onPress={handleReassignLead}
                disabled={!targetOperatorId}
              >
                <Text style={styles.confirmButtonText}>Reassign</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#E2E8F0',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  operatorSelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 12,
  },
  operatorButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  operatorButtonActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  operatorButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1E40AF',
  },
  operatorButtonTextActive: {
    color: '#FFFFFF',
  },
  leadsSection: {
    flex: 1,
  },
  leadsList: {
    flex: 1,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  leadInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    flex: 1,
  },
  reassignButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 10,
  },
  reassignButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: 350,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  operatorList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  operatorOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  operatorOptionSelected: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1E293B',
    marginBottom: 4,
  },
  operatorNameSelected: {
    color: '#FFFFFF',
  },
  operatorEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
  },
  operatorEmailSelected: {
    color: '#E2E8F0',
  },
  modalActions: {
    flexDirection: 'row' as const,
    margin: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    alignItems: 'center' as const,
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
    alignItems: 'center' as const,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
}; 