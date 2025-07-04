import React, { useMemo } from 'react';
import WorkTrackingBoard from '@/components/WorkTrackingBoard';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';

export default function WorkTrackingPage() {
  const { user } = useAuth();
  const { customers, leads } = useData();

  // Filter customers for call operators: only those whose related lead was created by the current user
  const filteredCustomers = useMemo(() => {
    if (user) {
      // Find all lead IDs created by this user
      const myLeadIds = new Set(
        leads.filter(l => l.created_by === user.id).map(l => l.id)
      );
      return customers.filter(c => c.lead_id && myLeadIds.has(c.lead_id));
    }
    return customers;
  }, [user, customers, leads]);

  // WorkTrackingBoard uses useData for customers, so we do not pass a prop
  // Optionally, you could create a context for filtered customers if needed
  // For now, just filter in the board if needed, or here for future use
  return <WorkTrackingBoard />;
} 