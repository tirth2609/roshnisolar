// types/auth.ts
export type UserRole = 'salesman' | 'call_operator' | 'technician' | 'team_lead' | 'super_admin';

// Reflects the structure of your 'app_users' table
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;   // Changed from isActive to is_active
  created_at: string;  // Changed from createdAt to created_at
  updated_at: string;  // Added, assuming your table has an updated_at column
  // Add any other fields from your app_users table here, using snake_case
}

// Frontend AppUser type (camelCase) for use in React components
export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;    // camelCase version
  createdAt: string;    // camelCase version
  updatedAt: string;    // camelCase version
  // Add any other fields as needed
}

// AuthState and related types are now managed internally by AuthContext.tsx
// So, they are removed from this types file to keep it focused on data models.