/**
 * Admin Configuration
 * ===================
 * SECURITY: This file defines the authorized admin email.
 * Only this email can access the admin panel.
 * 
 * NOTE: This is frontend validation only. 
 * Backend security is enforced via database triggers and RLS policies.
 */

export const ADMIN_CONFIG = {
  // The only email authorized to access admin panel
  AUTHORIZED_EMAIL: 'naveenbharatprism@gmail.com',
  
  // Check if an email is the authorized admin
  isAuthorizedAdmin: (email: string | null | undefined): boolean => {
    if (!email) return false;
    return email.toLowerCase().trim() === ADMIN_CONFIG.AUTHORIZED_EMAIL.toLowerCase();
  }
} as const;
