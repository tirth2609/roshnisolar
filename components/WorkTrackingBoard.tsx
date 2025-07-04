import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions, Alert,
  RefreshControl, TouchableOpacity, Modal
} from 'react-native';
import { useData } from '@/contexts/DataContext';
import { Customer, ProjectStatus } from '@/types/customers';
import {
  Clock, Truck, DollarSign, Wrench, CheckCircle,
  Building, Phone, Move
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';

const { width } = Dimensions.get('window');

const projectStatuses: ProjectStatus[] = [
  'Awaiting 1st Payment',
  'Material Distribution',
  'Awaiting 2nd Payment',
  'Work in Progress',
  'Meter Installation',
  'Completed',
];

const statusIcons = {
  'Awaiting 1st Payment': <DollarSign size={24} color="#F59E0B" />,
  'Material Distribution': <Truck size={24} color="#3B82F6" />,
  'Awaiting 2nd Payment': <DollarSign size={24} color="#F59E0B" />,
  'Work in Progress': <Wrench size={24} color="#8B5CF6" />,
  'Meter Installation': <Clock size={24} color="#10B981" />,
  'Completed': <CheckCircle size={24} color="#16A34A" />,
};

const CustomerCard = ({ item, onUpdateStatus }: { item: Customer; onUpdateStatus: (item: Customer) => void; }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{item.customer_name}</Text>
    <View style={styles.cardRow}>
      <Phone size={14} color="#64748B" />
      <Text style={styles.cardText}>{item.phone_number}</Text>
    </View>
    <View style={styles.cardRow}>
      <Building size={14} color="#64748B" />
      <Text style={styles.cardText}>{item.property_type}</Text>
    </View>
    {item.project_status !== 'Completed' && (
      <TouchableOpacity style={styles.changeStatusButton} onPress={() => onUpdateStatus(item)}>
        <Move size={14} color="#3B82F6" />
        <Text style={styles.changeStatusButtonText}>Change Status</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function WorkTrackingBoard() {
  const { customers, updateCustomerProjectStatus, isLoading, refreshData } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(projectStatuses[0]);

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newStatus, setNewStatus] = useState<ProjectStatus>('Awaiting 1st Payment');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const customersByStatus = useMemo(() => {
    const grouped: { [key in ProjectStatus]?: Customer[] } = {};
    projectStatuses.forEach(status => {
      grouped[status] = customers.filter(c => c.project_status === status);
    });
    return grouped;
  }, [customers]);
  
  const handleOpenModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setNewStatus(customer.project_status || 'Awaiting 1st Payment');
    setModalVisible(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedCustomer) return;
    updateCustomerProjectStatus(selectedCustomer.id, newStatus).catch(error => {
      console.error('Failed to update project status:', error);
      Alert.alert('Error', 'Could not update the project status.');
    });
    setModalVisible(false);
    setSelectedCustomer(null);
  };

  const renderCustomerList = () => {
    const list = customersByStatus[selectedStatus] || [];
    if (isLoading) {
      return <Text style={styles.infoText}>Loading customers...</Text>;
    }
    if (list.length === 0) {
      return <Text style={styles.infoText}>No customers in this status.</Text>;
    }
    return list.map(item => (
      <CustomerCard key={item.id} item={item} onUpdateStatus={handleOpenModal} />
    ));
  };
  
  return (
    <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={styles.container}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />}
      >
        <View style={styles.statsContainer}>
          {projectStatuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statButton,
                selectedStatus === status && styles.selectedStatButton
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <View style={styles.statIcon}>{statusIcons[status]}</View>
              <Text style={styles.statTitle}>{status}</Text>
              <Text style={styles.statCount}>{customersByStatus[status]?.length || 0}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Customers in "{selectedStatus}"</Text>
          {renderCustomerList()}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Status for {selectedCustomer?.customer_name}</Text>
            <Picker
              selectedValue={newStatus}
              onValueChange={(itemValue) => setNewStatus(itemValue as ProjectStatus)}
            >
              {projectStatuses.map(s => <Picker.Item key={s} label={s} value={s} />)}
            </Picker>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handleUpdateStatus}>
                <Text style={styles.confirmButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statButton: {
    width: (width / 2) - 20,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedStatButton: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    marginBottom: 8,
  },
  statTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  statCount: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1F2937',
    marginTop: 4,
  },
  listContainer: {
    padding: 15,
  },
  listHeader: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
    color: '#111827',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    marginLeft: 6,
  },
  changeStatusButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E0E7FF',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeStatusButtonText: {
    color: '#3B82F6',
    marginLeft: 8,
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginLeft: 10,
    borderRadius: 6,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
  },
  confirmButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  }
}); 