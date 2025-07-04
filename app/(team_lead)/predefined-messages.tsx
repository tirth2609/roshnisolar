import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Save,
  Filter,
  Search,
  Tag,
  Clock,
  User,
} from 'lucide-react-native';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { PredefinedMessage, CreateMessageData, UpdateMessageData, MESSAGE_CATEGORIES } from '@/types/messages';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  addButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    color: theme.textInverse,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.textSecondary,
  },
  filterButtonTextActive: {
    color: theme.textInverse,
  },
  messageCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  messageTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.text,
    flex: 1,
    marginRight: 12,
  },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: theme.warning,
  },
  deleteButton: {
    backgroundColor: theme.error,
  },
  messageContent: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.primary,
    marginLeft: 4,
  },
  messageDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: theme.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: theme.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: screenWidth - 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.text,
  },
  closeButton: {
    padding: 8,
  },
  modalInput: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    marginBottom: 16,
  },
  modalTextArea: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.border,
    color: theme.text,
    marginBottom: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: theme.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  saveButton: {
    backgroundColor: theme.primary,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  cancelButtonText: {
    color: theme.text,
  },
  saveButtonText: {
    color: theme.textInverse,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function PredefinedMessagesScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { 
    predefinedMessages, 
    isLoading, 
    addPredefinedMessage, 
    updatePredefinedMessage, 
    deletePredefinedMessage,
    refreshData
  } = useData();
  
  const styles = getStyles(theme);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMessage, setEditingMessage] = useState<PredefinedMessage | null>(null);
  const [formData, setFormData] = useState<CreateMessageData>({
    title: '',
    message: '',
    category: 'general',
  });

  useEffect(() => {
    // Refresh data when component mounts
    const refreshData = async () => {
      // The predefinedMessages will be loaded by the DataContext
    };
    refreshData();
  }, []);

  const filteredMessages = predefinedMessages.filter(message => {
    const matchesSearch = message.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         message.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || message.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddMessage = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await addPredefinedMessage(formData);
      setModalVisible(false);
      setFormData({ title: '', message: '', category: 'general' });
      Alert.alert('Success', 'Message created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create message');
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !formData.title.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const updateData: UpdateMessageData = {
        title: formData.title,
        message: formData.message,
        category: formData.category,
      };
      await updatePredefinedMessage(editingMessage.id, updateData);
      setModalVisible(false);
      setEditingMessage(null);
      setFormData({ title: '', message: '', category: 'general' });
      Alert.alert('Success', 'Message updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update message');
    }
  };

  const handleDeleteMessage = async (message: PredefinedMessage) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePredefinedMessage(message.id);
              Alert.alert('Success', 'Message deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (message: PredefinedMessage) => {
    setEditingMessage(message);
    setFormData({
      title: message.title,
      message: message.message,
      category: message.category,
    });
    setModalVisible(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh data through DataContext
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const openAddModal = () => {
    setEditingMessage(null);
    setFormData({ title: '', message: '', category: 'general' });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingMessage(null);
    setFormData({ title: '', message: '', category: 'general' });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.primary, theme.primary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Predefined Messages</Text>
        <Text style={styles.headerSubtitle}>Manage your message templates</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color={theme.textInverse} />
          <Text style={styles.addButtonText}>Add New Message</Text>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedCategory === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedCategory === 'all' && styles.filterButtonTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {MESSAGE_CATEGORIES.map(category => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.filterButton,
                selectedCategory === category.value && styles.filterButtonActive
              ]}
              onPress={() => setSelectedCategory(category.value)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedCategory === category.value && styles.filterButtonTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primaryLight }]}>
              <MessageSquare size={32} color={theme.primary} />
            </View>
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first predefined message to get started'
              }
            </Text>
          </View>
        ) : (
          filteredMessages.map(message => (
            <View key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <Text style={styles.messageTitle}>{message.title}</Text>
                <View style={styles.messageActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEditModal(message)}
                  >
                    <Edit size={16} color={theme.textInverse} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteMessage(message)}
                  >
                    <Trash2 size={16} color={theme.textInverse} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.messageContent}>{message.message}</Text>
              
              <View style={styles.messageMeta}>
                <View style={styles.messageCategory}>
                  <Tag size={12} color={theme.primary} />
                  <Text style={styles.categoryText}>
                    {MESSAGE_CATEGORIES.find(c => c.value === message.category)?.label || message.category}
                  </Text>
                </View>
                <Text style={styles.messageDate}>
                  {new Date(message.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMessage ? 'Edit Message' : 'Add New Message'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Message title"
              placeholderTextColor={theme.textSecondary}
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />

            <TextInput
              style={styles.modalTextArea}
              placeholder="Message content"
              placeholderTextColor={theme.textSecondary}
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              multiline
            />

            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                style={{ color: theme.text }}
              >
                {MESSAGE_CATEGORIES.map(category => (
                  <Picker.Item
                    key={category.value}
                    label={category.label}
                    value={category.value}
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={editingMessage ? handleEditMessage : handleAddMessage}
              >
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {editingMessage ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 