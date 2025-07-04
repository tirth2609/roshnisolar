import { Alert } from 'react-native';
import { supabase } from './supabase';

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reschedule' | 'lead_assigned' | 'lead_completed' | 'general';
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export class NotificationService {
  static async createNotification(notification: Omit<NotificationData, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          is_read: notification.isRead,
        })
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  // Helper method to create reschedule notification
  static async createRescheduleNotification(
    userId: string,
    leadId: string,
    customerName: string,
    rescheduledDate: string,
    reason: string
  ) {
    const title = 'Lead Rescheduled';
    const message = `Lead for ${customerName} has been rescheduled to ${new Date(rescheduledDate).toLocaleDateString()}. Reason: ${reason}`;

    return this.createNotification({
      userId,
      title,
      message,
      type: 'reschedule',
      data: { leadId, rescheduledDate, reason },
      isRead: false,
    });
  }

  // Helper method to create lead assignment notification
  static async createLeadAssignmentNotification(
    userId: string,
    leadId: string,
    customerName: string
  ) {
    const title = 'New Lead Assigned';
    const message = `You have been assigned a new lead: ${customerName}`;

    return this.createNotification({
      userId,
      title,
      message,
      type: 'lead_assigned',
      data: { leadId },
      isRead: false,
    });
  }

  // Helper method to create lead completion notification
  static async createLeadCompletionNotification(
    userId: string,
    leadId: string,
    customerName: string
  ) {
    const title = 'Lead Completed';
    const message = `Lead for ${customerName} has been completed and converted to customer.`;

    return this.createNotification({
      userId,
      title,
      message,
      type: 'lead_completed',
      data: { leadId },
      isRead: false,
    });
  }

  // Show local notification (for immediate feedback)
  static showLocalNotification(title: string, message: string) {
    Alert.alert(title, message);
  }
} 