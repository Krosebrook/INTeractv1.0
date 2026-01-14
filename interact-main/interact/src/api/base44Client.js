import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "691e3ae3bd4916f2e05ae35e", 
  requiresAuth: true // Ensure authentication is required for all operations
});
